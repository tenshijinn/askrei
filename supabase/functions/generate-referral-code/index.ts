import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress, xUserId } = await req.json();

    if (!walletAddress) {
      throw new Error('walletAddress is required');
    }

    console.log('Generating/retrieving referral code for wallet:', walletAddress);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user already has a referral code
    const { data: existing } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (existing) {
      console.log('Existing referral code found:', existing.referral_code);
      
      // Update x_user_id if provided and different
      if (xUserId && existing.x_user_id !== xUserId) {
        await supabase
          .from('referral_codes')
          .update({ x_user_id: xUserId })
          .eq('id', existing.id);
      }
      
      return new Response(
        JSON.stringify({
          referralCode: existing.referral_code,
          isActive: existing.is_active,
          createdAt: existing.created_at,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a new unique code
    let referralCode = generateCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const { data: codeExists } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('referral_code', referralCode)
        .single();

      if (!codeExists) break;
      
      referralCode = generateCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique referral code');
    }

    // Insert new referral code
    const { data: newCode, error: insertError } = await supabase
      .from('referral_codes')
      .insert({
        wallet_address: walletAddress,
        x_user_id: xUserId || null,
        referral_code: referralCode,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting referral code:', insertError);
      throw new Error('Failed to create referral code');
    }

    console.log('Created new referral code:', referralCode);

    return new Response(
      JSON.stringify({
        referralCode: newCode.referral_code,
        isActive: newCode.is_active,
        createdAt: newCode.created_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in generate-referral-code:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate referral code' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
