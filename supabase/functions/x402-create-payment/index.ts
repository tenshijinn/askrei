import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from "https://esm.sh/@solana/web3.js@1.98.4";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { fetchSolPriceUsd } from '../_shared/sol-price.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const paymentSchema = z.object({
  amount: z.number().positive().max(10000),
  memo: z.string().max(500).optional(),
  payerPublicKey: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validated = paymentSchema.parse(body);
    const { amount, memo, payerPublicKey } = validated;

    // Initialize Solana connection with Helius RPC
    const heliusApiKey = Deno.env.get('HELIUS_API_KEY');
    if (!heliusApiKey) {
      throw new Error('HELIUS_API_KEY not configured');
    }

    const connection = new Connection(
      `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`,
      'confirmed'
    );

    // Treasury wallet (recipient)
    const TREASURY_WALLET = '5JXJQSFZMxiQNmG4nx3bs2FnoZZsgz6kpVrNDxfBjb1s';
    const recipientPubkey = new PublicKey(TREASURY_WALLET);
    const payerPubkey = new PublicKey(payerPublicKey);

    // Generate unique reference for this payment
    const reference = Keypair.generate().publicKey;

    // Fetch current SOL price in USD from multi-source oracle (Jupiter + Pyth + CoinGecko)
    console.log(`[x402-create-payment] Fetching SOL price for $${amount} USD...`);
    let solPrice: number;
    try {
      const result = await fetchSolPriceUsd('[x402-create-payment]');
      solPrice = result.price;
    } catch (err: any) {
      console.error('[x402-create-payment] Price oracle failure:', err.message);
      return new Response(
        JSON.stringify({
          error: 'Unable to fetch a trustworthy SOL price right now. Please try again in a moment.',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Convert USD amount to SOL
    const solAmount = amount / solPrice;
    console.log(`[x402-create-payment] Converted $${amount} USD to ${solAmount} SOL at $${solPrice}/SOL`);

    // Convert SOL amount to lamports
    const lamports = Math.floor(solAmount * 1e9);

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');

    // Create transaction
    const transaction = new Transaction({
      feePayer: payerPubkey,
      blockhash,
      lastValidBlockHeight,
    });

    // Add transfer instruction with reference for tracking
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: payerPubkey,
        toPubkey: recipientPubkey,
        lamports,
      })
    );

    // Add reference as a read-only key (standard Solana Pay pattern)
    transaction.instructions[0].keys.push({
      pubkey: reference,
      isSigner: false,
      isWritable: false,
    });

    // Serialize transaction (without signatures)
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    // Store payment record in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: dbError } = await supabase
      .from('payment_references')
      .insert({
        reference: reference.toString(),
        amount: solAmount,
        memo: memo || null,
        payer: payerPublicKey,
        status: 'pending',
        payment_type: 'x402',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store payment reference');
    }

    return new Response(
      JSON.stringify({
        transaction: serializedTransaction.toString('base64'),
        reference: reference.toString(),
        amount,
        solAmount,
        solPrice,
        blockhash,
        lastValidBlockHeight,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('x402-create-payment error:', error);
    
    // Handle zod validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data',
          details: error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
