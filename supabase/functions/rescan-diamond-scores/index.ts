// Rescan Diamond scores for all wallets in rei_registry.
// Provider-agnostic: fetches raw signals from Moralis (Solana) or on-chain
// providers (Helius/Birdeye or Alchemy/Blockscout) and recomputes via the
// Diamonds engine. Fail-soft per wallet.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import {
  normalizeMoralis,
  type MoralisRawBundle,
} from '../_shared/diamonds/providers/moralis.ts';
import { fetchHeliusSignals } from '../_shared/diamonds/providers/helius.ts';
import { fetchBirdeyeSignals } from '../_shared/diamonds/providers/birdeye.ts';
import { fetchAlchemySignals } from '../_shared/diamonds/providers/alchemy.ts';
import { fetchBlockscoutSignals } from '../_shared/diamonds/providers/blockscout.ts';
import { computeDiamonds } from '../_shared/diamonds/engine.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchMoralisBundle(address: string): Promise<MoralisRawBundle> {
  const apiKey = Deno.env.get('MORALIS_API_KEY');
  const bundle: MoralisRawBundle = {};
  if (!apiKey) return bundle;

  const endpoints: Array<[keyof MoralisRawBundle, string]> = [
    ['portfolio', `https://solana-gateway.moralis.io/account/mainnet/${address}/portfolio`],
    ['swaps',     `https://solana-gateway.moralis.io/account/mainnet/${address}/swaps`],
    ['tokens',    `https://solana-gateway.moralis.io/account/mainnet/${address}/tokens`],
    ['nfts',      `https://solana-gateway.moralis.io/account/mainnet/${address}/nft`],
  ];

  await Promise.all(
    endpoints.map(async ([field, url]) => {
      try {
        const res = await fetch(url, {
          headers: { 'X-API-Key': apiKey, 'Accept': 'application/json' },
        });
        if (res.ok) bundle[field] = await res.json();
        else console.warn(`[moralis] ${field} ${res.status}`);
      } catch (e) {
        console.warn(`[moralis] ${field} error:`, (e as Error).message);
      }
    }),
  );

  return bundle;
}

async function rescanOne(address: string) {
  const isEvm = address.startsWith('0x');
  const moralisRaw = isEvm ? {} : await fetchMoralisBundle(address);

  const signals = await Promise.all(
    isEvm
      ? [
          Promise.resolve(normalizeMoralis(moralisRaw)),
          fetchAlchemySignals(address),
          fetchBlockscoutSignals(address),
        ]
      : [
          Promise.resolve(normalizeMoralis(moralisRaw)),
          fetchHeliusSignals(address),
          fetchBirdeyeSignals(address),
        ],
  );

  return computeDiamonds(signals);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body = await req.json().catch(() => ({} as any));
    const filterId: string | undefined = body?.id;
    const filterHandle: string | undefined = body?.handle;

    let query = supabase
      .from('rei_registry')
      .select('id, handle, wallet_address, profile_analysis');
    if (filterId) query = query.eq('id', filterId);
    if (filterHandle) query = query.ilike('handle', filterHandle);

    const { data: rows, error } = await query;
    if (error) throw error;

    const results: Array<Record<string, unknown>> = [];

    for (const row of rows ?? []) {
      const address = row.wallet_address as string | null;
      if (!address) {
        results.push({ id: row.id, handle: row.handle, skipped: 'no wallet' });
        continue;
      }

      try {
        const behaviour = await rescanOne(address);

        // Preserve existing profile_analysis but refresh wallet_behaviour.
        const existingAnalysis = (row.profile_analysis as Record<string, unknown> | null) ?? null;
        const nextAnalysis = existingAnalysis
          ? { ...existingAnalysis, wallet_behaviour: behaviour }
          : { wallet_behaviour: behaviour };

        const { error: upErr } = await supabase
          .from('rei_registry')
          .update({
            diamond_score: behaviour.diamond_score,
            diamond_tier: behaviour.diamond_tier,
            wallet_behaviour: behaviour,
            profile_analysis: nextAnalysis,
          })
          .eq('id', row.id);

        if (upErr) throw upErr;

        results.push({
          id: row.id,
          handle: row.handle,
          address,
          diamond_score: behaviour.diamond_score,
          diamond_tier: behaviour.diamond_tier,
          providers: behaviour.providers_used,
        });
        console.log(
          `[rescan] ${row.handle} ${address} -> ${behaviour.diamond_score} (${behaviour.diamond_tier}) via ${behaviour.providers_used.join(',') || 'none'}`,
        );
      } catch (e) {
        console.error(`[rescan] failed for ${row.handle}:`, (e as Error).message);
        results.push({ id: row.id, handle: row.handle, error: (e as Error).message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, count: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('[rescan] fatal:', (e as Error).message);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
