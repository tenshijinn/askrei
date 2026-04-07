import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TwitterTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface TwitterUserResponse {
  data: {
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
    verified?: boolean;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { code, action, redirectUri, codeVerifier, skipWhitelistCheck } = body;

    if (action === 'getAuthUrl') {
      const clientId = Deno.env.get('TWITTER_CLIENT_ID')!;
      
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'tweet.read users.read offline.access');
      authUrl.searchParams.set('state', crypto.randomUUID());
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');

      console.log('Generated auth URL:', authUrl.toString());

      return new Response(
        JSON.stringify({ 
          authUrl: authUrl.toString(),
          codeVerifier 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'exchangeToken') {
      const clientId = Deno.env.get('TWITTER_CLIENT_ID')!;
      const clientSecret = Deno.env.get('TWITTER_CLIENT_SECRET')!;

      console.log('Exchanging code for token...');

      // Exchange code for access token
      const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange error:', errorText);
        throw new Error(`Failed to exchange token: ${errorText}`);
      }

      const tokenData: TwitterTokenResponse = await tokenResponse.json();
      console.log('Token received successfully');

      // Get user info (include verified_type for X Premium / Blue checkmark)
      const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,verified,verified_type', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('User fetch error:', errorText);
        throw new Error(`Failed to fetch user: ${errorText}`);
      }

      const userData: TwitterUserResponse = await userResponse.json();
      console.log('User data received:', userData.data.username);

      // Get high-resolution profile image (replace _normal with _400x400)
      let profileImageUrl = userData.data.profile_image_url;
      if (profileImageUrl) {
        profileImageUrl = profileImageUrl.replace('_normal', '_400x400');
      }

      // Check if user is on the whitelist (case-insensitive) - skip for admin login
      let isVerified = false;
      let whitelistEntry = null;
      
      if (!skipWhitelistCheck) {
        const { data: whitelistData, error: whitelistError } = await supabase
          .from('twitter_whitelist')
          .select('*')
          .ilike('twitter_handle', userData.data.username)
          .maybeSingle();

        if (whitelistError) {
          console.error('Whitelist check error:', whitelistError);
        }

        whitelistEntry = whitelistData;
        isVerified = !!whitelistEntry;
        console.log('Whitelist verification:', isVerified ? 'VERIFIED' : 'NOT VERIFIED');
      } else {
        console.log('Skipping whitelist check (admin login)');
        isVerified = true; // Admin bypasses whitelist
      }

      return new Response(
        JSON.stringify({
          user: {
            x_user_id: userData.data.id,
            handle: userData.data.username,
            display_name: userData.data.name,
            profile_image_url: profileImageUrl,
            verified: userData.data.verified || false,
          },
          bluechip_verified: isVerified,
          verification_type: whitelistEntry?.verification_type || null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
}

function base64URLEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
