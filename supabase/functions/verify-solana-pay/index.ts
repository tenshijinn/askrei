// Edge function for verifying Solana Pay transactions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Connection, PublicKey } from "npm:@solana/web3.js@^1.98.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TREASURY_WALLET = '5JXJQSFZMxiQNmG4nx3bs2FnoZZsgz6kpVrNDxfBjb1s';
const HELIUS_API_KEY = Deno.env.get('HELIUS_API_KEY') || '';
const SOLANA_RPC = HELIUS_API_KEY 
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : 'https://api.mainnet-beta.solana.com'; // Fallback to public RPC
const REQUIRED_USD_AMOUNT = 5;
const AMOUNT_VARIANCE = 0.02; // 2% variance allowed
const MIN_MARKET_CAP = 100_000_000; // $100M minimum

interface VerifyPaymentRequest {
  reference: string;
  walletAddress: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reference, walletAddress }: VerifyPaymentRequest = await req.json();

    console.log('Verifying Solana Pay payment:', { reference, walletAddress });
    console.log('Using RPC:', HELIUS_API_KEY ? 'Helius' : 'Public mainnet');

    if (!reference || !walletAddress) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Connect to Solana
    const connection = new Connection(SOLANA_RPC, 'confirmed');
    const referencePubkey = new PublicKey(reference);

    // Find transactions with this reference
    const signatures = await connection.getSignaturesForAddress(referencePubkey, { limit: 10 });

    if (signatures.length === 0) {
      console.log('No transaction found for reference');
      return new Response(
        JSON.stringify({ verified: false, error: 'Payment not found. Please wait a moment and try again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the most recent transaction
    const signature = signatures[0].signature;
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0
    });

    if (!tx) {
      console.log('Transaction details not found');
      return new Response(
        JSON.stringify({ verified: false, error: 'Transaction not confirmed yet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log sender for debugging (but don't block payment)
    const accountKeys = 'accountKeys' in tx.transaction.message 
      ? tx.transaction.message.accountKeys 
      : tx.transaction.message.staticAccountKeys;
    
    const txSender = accountKeys[0].toString();
    console.log('Payment sender:', txSender, 'Connected wallet:', walletAddress);

    // Find transfer to treasury
    const treasuryIndex = accountKeys.findIndex(
      (key: PublicKey) => key.toString() === TREASURY_WALLET
    );

    if (treasuryIndex < 0) {
      console.log('Treasury wallet not found in transaction');
      return new Response(
        JSON.stringify({ verified: false, error: 'Payment not sent to correct address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const preBalance = tx.meta?.preBalances[treasuryIndex] || 0;
    const postBalance = tx.meta?.postBalances[treasuryIndex] || 0;
    const transferAmount = (postBalance - preBalance) / 1e9; // Convert lamports to SOL

    console.log('Transfer amount:', transferAmount, 'SOL');

    // Only accept SOL transfers (SPL tokens temporarily disabled)
    if (transferAmount <= 0) {
      console.log('No SOL transfer detected');
      return new Response(
        JSON.stringify({ verified: false, error: 'No SOL payment detected. Please pay with SOL.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenMint = 'SOL';
    const tokenAmount = transferAmount;
    
    // SOL transfer - get SOL price from CoinGecko with retry and timeout
    console.log('[verify-solana-pay] Fetching SOL price from CoinGecko...');
    let solPrice = 0;
    let lastError = '';
    const maxRetries = 3;
    const timeout = 10000; // 10 seconds
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[verify-solana-pay] Attempt ${attempt}/${maxRetries}: CoinGecko request started`);
        const startTime = Date.now();
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const priceResponse = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
          { 
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
          }
        );
        clearTimeout(timeoutId);
        
        const responseTime = Date.now() - startTime;
        
        if (!priceResponse.ok) {
          if (priceResponse.status === 429) {
            lastError = 'Rate limited by CoinGecko';
            console.log(`[verify-solana-pay] Attempt ${attempt}/${maxRetries}: ${lastError}`);
          } else if (priceResponse.status === 503 || priceResponse.status === 502) {
            lastError = 'CoinGecko service unavailable';
            console.log(`[verify-solana-pay] Attempt ${attempt}/${maxRetries}: ${lastError}`);
          } else {
            lastError = `HTTP ${priceResponse.status}: ${priceResponse.statusText}`;
            console.log(`[verify-solana-pay] Attempt ${attempt}/${maxRetries}: Failed - ${lastError}`);
          }
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
          continue;
        }
        
        const priceData = await priceResponse.json();
        solPrice = priceData?.solana?.usd || 0;
        
        if (solPrice > 0 && solPrice >= 10 && solPrice <= 1000) {
          console.log(`[verify-solana-pay] Attempt ${attempt}/${maxRetries}: Success - SOL price $${solPrice} (response time: ${responseTime}ms)`);
          break;
        } else {
          lastError = `Invalid price data: ${solPrice}`;
          console.log(`[verify-solana-pay] Attempt ${attempt}/${maxRetries}: ${lastError}`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          lastError = 'Request timed out';
          console.log(`[verify-solana-pay] Attempt ${attempt}/${maxRetries}: ${lastError}`);
        } else {
          lastError = error.message || 'Network error';
          console.log(`[verify-solana-pay] Attempt ${attempt}/${maxRetries}: ${lastError}`);
        }
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    if (solPrice === 0 || solPrice < 10 || solPrice > 1000) {
      console.log('[verify-solana-pay] Failed to fetch SOL price after all retries. Last error:', lastError);
      
      let userMessage = 'Unable to verify payment price. ';
      if (lastError.includes('Rate limited')) {
        userMessage += 'Price service is rate limited. Please try again in a moment.';
      } else if (lastError.includes('unavailable') || lastError.includes('502') || lastError.includes('503')) {
        userMessage += 'Price service is temporarily unavailable. Please try again.';
      } else if (lastError.includes('timeout')) {
        userMessage += 'Price service timed out. Please try again.';
      } else {
        userMessage += 'Please try again in a moment.';
      }
      
      return new Response(
        JSON.stringify({ verified: false, error: userMessage }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const transferUSD = transferAmount * solPrice;
    console.log('SOL payment - USD value:', transferUSD);

    // Verify amount is $5 ±2%
    const minAmount = REQUIRED_USD_AMOUNT * (1 - AMOUNT_VARIANCE);
    const maxAmount = REQUIRED_USD_AMOUNT * (1 + AMOUNT_VARIANCE);

    if (transferUSD < minAmount) {
      console.log('Amount too low:', transferUSD, 'vs required', REQUIRED_USD_AMOUNT);
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: `Insufficient payment: $${transferUSD.toFixed(2)} (required: ~$${REQUIRED_USD_AMOUNT})`,
          amount: transferUSD
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (transferUSD > maxAmount) {
      console.log('Amount too high:', transferUSD, 'vs required', REQUIRED_USD_AMOUNT);
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: `Payment amount too high: $${transferUSD.toFixed(2)} (expected: ~$${REQUIRED_USD_AMOUNT})`,
          amount: transferUSD
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Payment verified successfully');
    return new Response(
      JSON.stringify({ 
        verified: true, 
        amount: transferUSD,
        tokenMint,
        tokenAmount,
        signature
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ 
        verified: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
