import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Connection, Transaction } from "https://esm.sh/@solana/web3.js@1.98.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signedTransaction, reference, referralSessionId, referralCode } = await req.json();

    if (!signedTransaction || !reference) {
      throw new Error('Missing required fields: signedTransaction, reference');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if payment reference exists and is pending
    const { data: paymentRef, error: refError } = await supabase
      .from('payment_references')
      .select('*')
      .eq('reference', reference)
      .eq('payment_type', 'x402')
      .single();

    if (refError || !paymentRef) {
      throw new Error('Payment reference not found or invalid');
    }

    if (paymentRef.status !== 'pending') {
      throw new Error('Payment reference already used');
    }

    // Initialize Solana connection with Helius RPC
    const heliusApiKey = Deno.env.get('HELIUS_API_KEY');
    if (!heliusApiKey) {
      throw new Error('HELIUS_API_KEY not configured');
    }

    const connection = new Connection(
      `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`,
      'confirmed'
    );

    // Deserialize and send transaction
    const transactionBuffer = Uint8Array.from(atob(signedTransaction), c => c.charCodeAt(0));
    const transaction = Transaction.from(transactionBuffer);

    // Send and confirm transaction
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');

    if (confirmation.value.err) {
      throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err));
    }

    // Update payment reference status
    const { error: updateError } = await supabase
      .from('payment_references')
      .update({
        status: 'completed',
        tx_signature: signature,
        updated_at: new Date().toISOString(),
      })
      .eq('reference', reference);

    if (updateError) {
      console.error('Failed to update payment status:', updateError);
    }

    // Track referral conversion if applicable
    if (referralSessionId || referralCode) {
      try {
        console.log('Tracking referral conversion for payment:', { referralSessionId, referralCode, payer: paymentRef.payer });
        
        const { data: conversionResult, error: conversionError } = await supabase.functions.invoke('track-referral-conversion', {
          body: {
            conversionType: 'payment',
            convertedWallet: paymentRef.payer,
            paymentAmount: paymentRef.amount,
            sessionId: referralSessionId,
            referralCode: referralCode,
          },
        });

        if (conversionError) {
          console.error('Failed to track referral conversion:', conversionError);
        } else {
          console.log('Referral conversion tracked:', conversionResult);
        }
      } catch (convError) {
        console.error('Error invoking track-referral-conversion:', convError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        signature,
        reference,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('x402-verify-payment error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Payment verification failed',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});