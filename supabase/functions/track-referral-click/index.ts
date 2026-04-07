import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const POINTS_PER_CLICK = 1;
const MAX_CLICKS_PER_IP_PER_HOUR = 10;

// Simple hash function for IP addresses (privacy-preserving)
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.slice(0, 10));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

function generateSessionId(): string {
  return crypto.randomUUID();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referralCode, sourceUrl, targetPath } = await req.json();

    if (!referralCode) {
      throw new Error('referralCode is required');
    }

    console.log('Tracking click for referral code:', referralCode);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify referral code exists and is active
    const { data: codeData, error: codeError } = await supabase
      .from('referral_codes')
      .select('wallet_address, is_active, x_user_id')
      .eq('referral_code', referralCode)
      .single();

    if (codeError || !codeData) {
      console.log('Invalid referral code:', referralCode);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid referral code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!codeData.is_active) {
      console.log('Inactive referral code:', referralCode);
      return new Response(
        JSON.stringify({ success: false, error: 'Referral code is inactive' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client info
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    const ipHash = await hashString(clientIP);
    const userAgentHash = await hashString(userAgent);
    const sessionId = generateSessionId();
    const today = new Date().toISOString().split('T')[0];

    // Rate limiting: Check clicks in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentClicks } = await supabase
      .from('referral_clicks')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('clicked_at', oneHourAgo);

    if ((recentClicks || 0) >= MAX_CLICKS_PER_IP_PER_HOUR) {
      console.log('Rate limit exceeded for IP hash:', ipHash.slice(0, 8));
      return new Response(
        JSON.stringify({ 
          success: true, 
          sessionId,
          pointsAwarded: false,
          reason: 'rate_limited'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing click today (deduplication)
    const { data: existingClick } = await supabase
      .from('referral_clicks')
      .select('id, points_awarded')
      .eq('referral_code', referralCode)
      .eq('ip_hash', ipHash)
      .eq('click_date', today)
      .single();

    if (existingClick) {
      console.log('Duplicate click detected for today');
      return new Response(
        JSON.stringify({ 
          success: true, 
          sessionId: existingClick.id,
          pointsAwarded: false,
          reason: 'duplicate'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record the click
    const { data: click, error: clickError } = await supabase
      .from('referral_clicks')
      .insert({
        referral_code: referralCode,
        ip_hash: ipHash,
        user_agent_hash: userAgentHash,
        source_url: sourceUrl || null,
        target_path: targetPath || '/',
        session_id: sessionId,
        click_date: today,
        points_awarded: true,
      })
      .select()
      .single();

    if (clickError) {
      console.error('Error recording click:', clickError);
      throw new Error('Failed to record click');
    }

    // Award points for the click
    const { error: pointsError } = await supabase.rpc('increment_user_points', {
      p_wallet_address: codeData.wallet_address,
      p_points: POINTS_PER_CLICK,
      p_x_user_id: codeData.x_user_id || null,
    });

    if (pointsError) {
      console.error('Error awarding points:', pointsError);
    }

    // Record points transaction
    await supabase.from('points_transactions').insert({
      wallet_address: codeData.wallet_address,
      points: POINTS_PER_CLICK,
      transaction_type: 'referral_click',
    });

    console.log('Click recorded, points awarded to:', codeData.wallet_address);

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: click.session_id,
        pointsAwarded: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in track-referral-click:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to track click' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
