import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const POINTS_PER_PAYMENT = 10;

const awardPointsSchema = z.object({
  walletAddress: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/),
  reference: z.string().min(1).max(100),
  amount: z.number().positive(),
  tokenMint: z.string().min(1).max(100),
  tokenAmount: z.number().positive()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validated = awardPointsSchema.parse(body);
    const { walletAddress, reference, amount, tokenMint, tokenAmount } = validated;

    console.log('Awarding points:', { walletAddress, reference, amount });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert points transaction - let unique constraint handle idempotency
    const { error: transactionError } = await supabase
      .from('points_transactions')
      .insert({
        wallet_address: walletAddress,
        transaction_type: 'earned',
        points: POINTS_PER_PAYMENT,
        solana_pay_reference: reference,
        payment_token_mint: tokenMint,
        payment_token_amount: tokenAmount
      });

    if (transactionError) {
      // Handle unique constraint violation (23505) - points already awarded
      if (transactionError.code === '23505') {
        console.log('Points already awarded for this reference');
        return new Response(
          JSON.stringify({ success: true, message: 'Points already awarded', points: POINTS_PER_PAYMENT }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.error('Error inserting points transaction:', transactionError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to record points transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Look up x_user_id from rei_registry for this wallet
    let xUserId: string | null = null;
    const { data: registryData } = await supabase
      .from('rei_registry')
      .select('x_user_id')
      .eq('wallet_address', walletAddress)
      .maybeSingle();
    if (registryData?.x_user_id) xUserId = registryData.x_user_id;

    // Use atomic increment function to update user points
    const { error: incrementError } = await supabase.rpc('increment_user_points', {
      p_wallet_address: walletAddress,
      p_points: POINTS_PER_PAYMENT,
      p_x_user_id: xUserId,
    });

    if (incrementError) {
      console.error('Error incrementing points:', incrementError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update points' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch updated total for response
    const { data: updatedPoints } = await supabase
      .from('user_points')
      .select('total_points')
      .eq('wallet_address', walletAddress)
      .single();

    console.log('Points awarded successfully');
    return new Response(
      JSON.stringify({ 
        success: true, 
        points: POINTS_PER_PAYMENT,
        newTotal: updatedPoints?.total_points || POINTS_PER_PAYMENT
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error awarding points:', error);
    
    // Handle zod validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid input data',
          details: error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
