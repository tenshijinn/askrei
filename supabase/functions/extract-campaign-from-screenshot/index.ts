import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  projectName: string;
  projectLink: string;
  screenshotUrl: string;
  employerWallet: string;
  paymentTxSignature: string;
  solanaPayReference?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { projectName, projectLink, screenshotUrl, employerWallet, paymentTxSignature, solanaPayReference } = body;

    if (!projectName || !projectLink || !screenshotUrl || !employerWallet || !paymentTxSignature) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Load skill categories so the model can pick from real IDs
    const { data: skillCategories } = await supabase
      .from('skill_categories')
      .select('id, name, keywords');

    const skillTaxonomy = (skillCategories || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      keywords: s.keywords || [],
    }));

    console.log('[extract-campaign] Calling Lovable AI for screenshot:', screenshotUrl);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `You analyze screenshots of Web3 campaign / quest / bounty / task pages and extract structured data. Be concise and accurate. If something is not visible, omit it.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract campaign details from this screenshot.

Project name (from user): ${projectName}
Project link (from user): ${projectLink}

Available skill categories (pick the IDs that best match the campaign's required skills, max 5):
${JSON.stringify(skillTaxonomy)}

Available role tags (pick the ones that best apply, max 5): dev, design, product, research, community, ops, content, marketing, analyst

Return:
- title: a clean, compelling title for the campaign (use project name if no clearer title visible)
- description: 1-3 sentence summary of what contributors will do
- compensation: prize pool / reward (e.g. "$10,000 prize pool", "500 USDC", "NFT + tokens"). Omit if not visible.
- company_name: brand/company running it (default to project name if not clear)
- role_tags: array of role tag strings
- skill_category_ids: array of skill category UUIDs from the list above
- end_date: ISO date string if a deadline is visible, else omit`,
              },
              { type: 'image_url', image_url: { url: screenshotUrl } },
            ],
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'save_campaign',
              description: 'Save the extracted campaign details',
              parameters: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  compensation: { type: 'string' },
                  company_name: { type: 'string' },
                  role_tags: { type: 'array', items: { type: 'string' } },
                  skill_category_ids: { type: 'array', items: { type: 'string' } },
                  end_date: { type: 'string' },
                },
                required: ['title', 'description'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'save_campaign' } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('[extract-campaign] AI error:', aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI extraction failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let extracted: any = {};
    if (toolCall?.function?.arguments) {
      try { extracted = JSON.parse(toolCall.function.arguments); }
      catch (e) { console.error('[extract-campaign] Failed to parse tool args:', e); }
    }

    console.log('[extract-campaign] Extracted:', extracted);

    // Validate skill_category_ids against actual UUIDs
    const validSkillIds = new Set(skillTaxonomy.map((s: any) => s.id));
    const skillIds = (extracted.skill_category_ids || []).filter((id: string) => validSkillIds.has(id));

    const taskInsert = {
      title: extracted.title || projectName,
      description: extracted.description || `Campaign for ${projectName}. See link for details.`,
      link: projectLink,
      og_image: screenshotUrl,
      compensation: extracted.compensation || null,
      company_name: extracted.company_name || projectName,
      role_tags: extracted.role_tags || [],
      skill_category_ids: skillIds,
      end_date: extracted.end_date || null,
      employer_wallet: employerWallet,
      payment_tx_signature: paymentTxSignature,
      solana_pay_reference: solanaPayReference || null,
      source: 'rocket-reach',
      opportunity_type: 'quest',
      status: 'active',
    };

    const { data: inserted, error: insertError } = await supabase
      .from('tasks')
      .insert(taskInsert)
      .select()
      .single();

    if (insertError) {
      console.error('[extract-campaign] Insert error:', insertError);
      throw new Error(`Failed to save campaign: ${insertError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      task: inserted,
      extracted,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[extract-campaign] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
