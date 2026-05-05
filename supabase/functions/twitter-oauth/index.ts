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
      authUrl.searchParams.set('scope', 'tweet.read users.read follows.read offline.access');
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

      // Verified-account check (uses user.fields.verified from /users/me — no extra API call)
      const isVerifiedAccount = userData.data.verified === true;

      // Follow-gate: must follow @askrei_ on X (skipped for admin or if not verified — saves a call)
      let followsAskrei = false;
      if (skipWhitelistCheck) {
        followsAskrei = true;
      } else if (isVerifiedAccount) {
        followsAskrei = await checkFollowsAskrei(
          supabase,
          userData.data.id,
          tokenData.access_token,
        );
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

// Cache @askrei_'s X user id across warm invocations
let cachedAskreiId: string | null = Deno.env.get('ASKREI_X_USER_ID') || null;
const ASKREI_HANDLE = 'askrei_';
const FOLLOW_CACHE_DAYS = 7;

async function getAskreiUserId(appBearerToken: string): Promise<string | null> {
  if (cachedAskreiId) return cachedAskreiId;
  try {
    const res = await fetch(
      `https://api.twitter.com/2/users/by/username/${ASKREI_HANDLE}`,
      { headers: { Authorization: `Bearer ${appBearerToken}` } },
    );
    if (!res.ok) {
      console.error('Failed to resolve askrei_ id:', await res.text());
      return null;
    }
    const json = await res.json();
    cachedAskreiId = json?.data?.id ?? null;
    return cachedAskreiId;
  } catch (e) {
    console.error('askrei_ lookup error:', e);
    return null;
  }
}

async function checkFollowsAskrei(
  supabase: ReturnType<typeof import('https://esm.sh/@supabase/supabase-js@2.75.1').createClient>,
  sourceUserId: string,
  userAccessToken: string,
): Promise<boolean> {
  // 1. Check cache
  try {
    const { data: cached } = await supabase
      .from('x_follow_checks')
      .select('follows_askrei, checked_at')
      .eq('x_user_id', sourceUserId)
      .maybeSingle();
    if (cached?.follows_askrei) {
      const ageMs = Date.now() - new Date(cached.checked_at).getTime();
      if (ageMs < FOLLOW_CACHE_DAYS * 24 * 60 * 60 * 1000) {
        console.log('Follow check cache HIT for', sourceUserId);
        return true;
      }
    }
  } catch (e) {
    console.error('Follow cache read error:', e);
  }

  // 2. Resolve askrei_ id (use user token as bearer — works for /users/by/username)
  const askreiId = await getAskreiUserId(userAccessToken);
  if (!askreiId) {
    console.error('Could not resolve @askrei_ id; failing open=false');
    return false;
  }

  // 3. Page through /following looking for askrei_
  let nextToken: string | undefined;
  let found = false;
  let pages = 0;
  do {
    const url = new URL(`https://api.twitter.com/2/users/${sourceUserId}/following`);
    url.searchParams.set('max_results', '1000');
    if (nextToken) url.searchParams.set('pagination_token', nextToken);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${userAccessToken}` },
    });
    if (!res.ok) {
      console.error('following lookup failed:', res.status, await res.text());
      return false;
    }
    const json = await res.json();
    const list: Array<{ id: string }> = json?.data ?? [];
    if (list.some((u) => u.id === askreiId)) {
      found = true;
      break;
    }
    nextToken = json?.meta?.next_token;
    pages++;
  } while (nextToken && pages < 5);

  // 4. Cache positive result
  if (found) {
    try {
      await supabase.from('x_follow_checks').upsert({
        x_user_id: sourceUserId,
        follows_askrei: true,
        checked_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Follow cache write error:', e);
    }
  }
  return found;
}

