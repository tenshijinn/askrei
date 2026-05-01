import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TREASURY_WALLET = '5JXJQSFZMxiQNmG4nx3bs2FnoZZsgz6kpVrNDxfBjb1s';

// ============= INTENT CLASSIFICATION SYSTEM =============

type Intent = 
  | 'SEARCH_JOBS' 
  | 'SEARCH_TASKS' 
  | 'SEARCH_TALENT' 
  | 'POST_JOB' 
  | 'POST_TASK' 
  | 'COMMUNITY_CONTRIBUTE' 
  | 'VIEW_PROFILE' 
  | 'MANAGE_DRAFTS' 
  | 'DRAFT_RESPONSE' 
  | 'PAYMENT_ACTION' 
  | 'HELP' 
  | 'GENERAL';

async function classifyIntent(
  message: string,
  userType: string,
  hasActiveDraft: boolean,
  lastToolCalled: string | null,
  recentContext: string,
  lovableApiKey: string
): Promise<Intent> {
  const classificationPrompt = `You are an intent classifier for a Web3 job portal chatbot. Classify the user's message into exactly ONE intent.

CONTEXT:
- User type: ${userType} (talent = looking for work, employer = looking to hire)
- Has active draft in progress: ${hasActiveDraft}
- Last tool called: ${lastToolCalled || 'none'}
- Recent conversation:
${recentContext}

USER MESSAGE: "${message}"

CLASSIFY INTO EXACTLY ONE:

SEARCH_JOBS - Talent wants to FIND job/contract/role opportunities for themselves
  Indicators: find jobs, match my skills, looking for work, any roles, hook me up with jobs, show me positions, what's available, jobs for me, find me web3 jobs, job search, employment opportunities

SEARCH_TASKS - Talent wants to FIND/DO task/bounty/gig/quest opportunities
  Indicators: any bounties, looking for a gig, I want to do a task, show me tasks, find tasks, available quests, I want to work on something, any gigs, find me bounties, looking for a task, do a task

SEARCH_TALENT - Employer wants to find/hire candidates from the talent pool
  Indicators: find developers, who can do X, show me candidates, looking for talent, search for designers, find people who know X

POST_JOB - User wants to CREATE a job listing to hire someone
  Indicators: post a job, I want to hire, list a position, create a job listing, hiring for, need to post a job, submit a job

POST_TASK - User wants to CREATE a task/bounty for others to complete
  Indicators: post a task, create a bounty, I have a gig to post, list a quest, submit a task, post a bounty, create a task for others

COMMUNITY_CONTRIBUTE - User found an opportunity elsewhere to share with community
  Indicators: I found a job to share, contribute this opportunity, submit something I saw, share an opportunity, I saw this job posting

VIEW_PROFILE - User wants to see their own profile/points/skills/stats
  Indicators: my profile, what are my skills, check my points, my stats, show my points, how many points, what's my score

MANAGE_DRAFTS - User wants to see/load/delete their drafts (not mid-flow continuation)
  Indicators: show my drafts, delete that draft, what drafts do I have, list my drafts, remove draft

DRAFT_RESPONSE - User is responding to a question in an active posting flow (providing data)
  CRITICAL: Use this when hasActiveDraft=true AND message looks like data being provided (title, description, URL, amount, company name, etc.)
  Indicators: Short data-like answers, URLs, amounts like "$500", company names, descriptions, yes/looks good/confirm

PAYMENT_ACTION - User indicating payment was made or asking about payment
  Indicators: I've paid, payment sent, verify my payment, transaction complete, I sent the payment, check payment

HELP - User asking how to use the system or what's possible
  Indicators: what can you do, help, how does this work, guide me, explain, what is Rei

GENERAL - Greetings, thanks, off-topic, or genuinely unclear intent
  Indicators: hello, hi, thanks, cool, okay, ambiguous messages, unrelated topics

CRITICAL DISAMBIGUATION RULES:
1. "find/search/show me/looking for" + opportunities = SEARCH intent (user is the worker seeking work)
2. "post/create/list/hire for" + opportunities = POST intent (user is creating work for others)
3. "I want to DO a task" = SEARCH_TASKS (user wants to work on existing tasks)
4. "I want to POST a task" = POST_TASK (user wants to create a task for others)
5. If hasActiveDraft=true and message is data-like (title, URL, company, amount, "yes", "looks good") = DRAFT_RESPONSE
6. "match my skills" / "jobs for me" = SEARCH_JOBS (talent seeking opportunities)
7. Consider user type but don't assume - talent can post, employer can search
8. If lastToolCalled includes "generate_solana_pay" and message mentions payment = PAYMENT_ACTION

Return ONLY the intent label (e.g., SEARCH_JOBS), nothing else.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: classificationPrompt }],
        max_tokens: 20,
        temperature: 0
      })
    });

    if (!response.ok) {
      console.error('[classifyIntent] API error:', response.status);
      return 'GENERAL';
    }

    const data = await response.json();
    const intent = data.choices?.[0]?.message?.content?.trim() as Intent;
    
    // Validate intent is one of our known intents
    const validIntents: Intent[] = [
      'SEARCH_JOBS', 'SEARCH_TASKS', 'SEARCH_TALENT', 'POST_JOB', 'POST_TASK',
      'COMMUNITY_CONTRIBUTE', 'VIEW_PROFILE', 'MANAGE_DRAFTS', 'DRAFT_RESPONSE',
      'PAYMENT_ACTION', 'HELP', 'GENERAL'
    ];
    
    if (validIntents.includes(intent)) {
      return intent;
    }
    
    console.log('[classifyIntent] Unknown intent returned:', intent);
    return 'GENERAL';
  } catch (error) {
    console.error('[classifyIntent] Error:', error);
    return 'GENERAL';
  }
}

function getToolsForIntent(intent: Intent, allTools: any[]): any[] {
  const toolSets: Record<Intent, string[]> = {
    'SEARCH_JOBS': ['search_jobs'],
    'SEARCH_TASKS': ['search_tasks'],
    'SEARCH_TALENT': ['search_talent', 'generate_solana_pay_qr', 'get_talent_profile'],
    'POST_JOB': [
      'start_paid_job_posting', 'check_my_drafts', 'load_draft', 'save_draft',
      'delete_draft', 'extract_og_data', 'generate_solana_pay_qr',
      'verify_and_post_job', 'complete_draft'
    ],
    'POST_TASK': [
      'start_paid_task_posting', 'check_my_drafts', 'load_draft', 'save_draft',
      'delete_draft', 'extract_og_data', 'generate_solana_pay_qr',
      'verify_and_post_task', 'complete_draft'
    ],
    'COMMUNITY_CONTRIBUTE': [
      'start_community_contribution', 'check_my_drafts', 'load_draft', 'save_draft',
      'delete_draft', 'extract_og_data', 'generate_solana_pay_qr',
      'verify_and_post_job', 'verify_and_post_task', 'complete_draft'
    ],
    'VIEW_PROFILE': ['get_my_profile'],
    'MANAGE_DRAFTS': ['check_my_drafts', 'load_draft', 'delete_draft'],
    'DRAFT_RESPONSE': [
      'save_draft', 'load_draft', 'check_my_drafts', 'extract_og_data', 
      'generate_solana_pay_qr', 'verify_and_post_job', 'verify_and_post_task', 'complete_draft'
    ],
    'PAYMENT_ACTION': [
      'verify_and_post_job', 'verify_and_post_task', 'complete_draft', 'generate_solana_pay_qr'
    ],
    'HELP': [], // No tools for help - pure conversational
    'GENERAL': allTools.map(t => t.function.name) // All tools for unclear intent
  };

  const allowedNames = toolSets[intent] || toolSets['GENERAL'];
  
  // If no tools allowed (HELP intent), return empty array
  if (allowedNames.length === 0) {
    return [];
  }
  
  return allTools.filter(t => allowedNames.includes(t.function.name));
}

async function checkForActiveDrafts(walletAddress: string, supabase: any): Promise<{ hasActive: boolean; lastToolHint: string | null }> {
  const activeStatuses = ['draft', 'collecting', 'confirming', 'payment_pending'];
  
  const { data: jobDrafts } = await supabase
    .from('job_drafts')
    .select('id, status, updated_at')
    .eq('wallet_address', walletAddress)
    .in('status', activeStatuses)
    .order('updated_at', { ascending: false })
    .limit(1);

  const { data: taskDrafts } = await supabase
    .from('task_drafts')
    .select('id, status, updated_at')
    .eq('wallet_address', walletAddress)
    .in('status', activeStatuses)
    .order('updated_at', { ascending: false })
    .limit(1);

  const hasJobDraft = jobDrafts && jobDrafts.length > 0;
  const hasTaskDraft = taskDrafts && taskDrafts.length > 0;
  
  let lastToolHint: string | null = null;
  if (hasJobDraft && hasTaskDraft) {
    // Compare which is more recent
    const jobTime = new Date(jobDrafts[0].updated_at).getTime();
    const taskTime = new Date(taskDrafts[0].updated_at).getTime();
    lastToolHint = jobTime > taskTime ? 'job_draft_active' : 'task_draft_active';
  } else if (hasJobDraft) {
    lastToolHint = 'job_draft_active';
  } else if (hasTaskDraft) {
    lastToolHint = 'task_draft_active';
  }

  return {
    hasActive: hasJobDraft || hasTaskDraft,
    lastToolHint
  };
}

function getIntentGuidance(intent: Intent): string {
  const guidance: Record<Intent, string> = {
    'SEARCH_JOBS': `[INTENT: SEARCH_JOBS]
User wants to FIND job opportunities for themselves.
ACTION: Call search_jobs immediately. It loads the user's profile internally and scores matches — do NOT call get_my_profile, do NOT mention the user's points, and do NOT ask the user for skills first.
Present results in clean terminal format with match reasons.`,
    
    'SEARCH_TASKS': `[INTENT: SEARCH_TASKS]
User wants to FIND task/bounty/gig opportunities to work on.
ACTION: Call search_tasks immediately. It loads the user's profile internally and scores matches — do NOT call get_my_profile, do NOT mention the user's points, and do NOT ask the user for skills first.
CARDS-ONLY OUTPUT: Do NOT list the tasks in terminal text. Write a single short intro line (e.g. "Here are some bounties that match your skills:") and then ONLY emit one [[rei-task:<id>]] marker per result on its own line — nothing else, no titles, no "Apply here" links, no descriptions. The UI renders the rich card from the marker. End with one short closing line if you want (e.g. "Want me to dig deeper into any of these?"). Never invent UUIDs — only use IDs returned by search_tasks. If search_tasks returns zero results, say so plainly and suggest they tap the avatar (top-right) → Edit Profile to add skills/role tags so Rei can match more — do NOT mention points.`,
    
    'SEARCH_TALENT': `[INTENT: SEARCH_TALENT]
Employer wants to find candidates matching their requirements.
ACTION: Use search_talent to find matching profiles. Explain payment required for full profiles.`,
    
    'POST_JOB': `[INTENT: POST_JOB]
User wants to CREATE a new job listing to hire someone.
ACTION: Call check_my_drafts first to see existing drafts, then guide through job posting flow.
Collect: title, company, description, requirements, compensation, deadline.`,
    
    'POST_TASK': `[INTENT: POST_TASK]
User wants to CREATE a new task/bounty for others to complete.
ACTION: Call check_my_drafts first to see existing drafts, then guide through task posting flow.
Collect: title, company, description, link (REQUIRED), compensation, end date.`,
    
    'COMMUNITY_CONTRIBUTE': `[INTENT: COMMUNITY_CONTRIBUTE]
User found an opportunity elsewhere and wants to share with the community.
ACTION: Use start_community_contribution. Explain they earn 10 points. Same $5 payment flow.`,
    
    'VIEW_PROFILE': `[INTENT: VIEW_PROFILE]
User wants to see their own profile, points, or stats.
ACTION: Call get_my_profile immediately and present results warmly.`,
    
    'MANAGE_DRAFTS': `[INTENT: MANAGE_DRAFTS]
User wants to manage their existing drafts (view/load/delete).
ACTION: Call check_my_drafts to show their drafts. Offer to load or delete.`,
    
    'DRAFT_RESPONSE': `[INTENT: DRAFT_RESPONSE]
User is providing data for an active posting flow (responding to a question).
ACTION: Save the field with save_draft and continue to next field or proceed to payment if complete.
If user says "looks good"/"yes"/"confirm" → proceed to payment with generate_solana_pay_qr.`,
    
    'PAYMENT_ACTION': `[INTENT: PAYMENT_ACTION]
User is indicating they made a payment or asking about payment status.
ACTION: Verify payment with verify_and_post_job or verify_and_post_task, then complete_draft.`,
    
    'HELP': `[INTENT: HELP]
User needs guidance on how to use the system.
ACTION: Explain capabilities warmly. DO NOT call any tools.
- Talent can: find jobs, find tasks/bounties, check profile/points, contribute opportunities
- Employers can: post jobs, post tasks, search talent`,
    
    'GENERAL': `[INTENT: GENERAL]
Intent unclear or general conversation.
ACTION: Respond naturally and try to understand what user needs. Ask clarifying questions if needed.`
  };

  return guidance[intent] || guidance['GENERAL'];
}

interface ChatRequest {
  message: string;
  walletAddress: string;
  conversationId?: string;
  userMode?: 'talent' | 'employer';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, walletAddress, conversationId, userMode }: ChatRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get or create conversation
    let convId = conversationId;
    const selectedUserType = userMode || 'talent';
    
    if (!convId) {
      const { data: existingConv } = await supabase
        .from('chat_conversations')
        .select('id, user_type')
        .eq('wallet_address', walletAddress)
        .single();

      if (existingConv) {
        convId = existingConv.id;
        // Update user type if it changed
        if (existingConv.user_type !== selectedUserType) {
          await supabase
            .from('chat_conversations')
            .update({ user_type: selectedUserType })
            .eq('id', existingConv.id);
        }
      } else {
        const { data: newConv } = await supabase
          .from('chat_conversations')
          .insert({ wallet_address: walletAddress, user_type: selectedUserType })
          .select()
          .single();

        convId = newConv.id;
      }
    } else {
      // Update existing conversation's user type
      await supabase
        .from('chat_conversations')
        .update({ user_type: selectedUserType })
        .eq('id', convId);
    }

    // Save user message
    await supabase
      .from('chat_messages')
      .insert({
        conversation_id: convId,
        role: 'user',
        content: message
      });

    // Get minimal conversation history - rely on database tools for context
    // Only last 3 messages for immediate conversational flow
    const { data: allMessages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: false })
      .limit(3);
    
    // Reverse to get chronological order
    const messages = (allMessages || []).reverse();

    // Check user type
    const { data: conv } = await supabase
      .from('chat_conversations')
      .select('user_type')
      .eq('id', convId)
      .single();

    const userType = conv?.user_type || 'employer';

    // Get current date/time for context
    const now = new Date();
    const currentDateReadable = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const currentTimeReadable = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    const currentISODate = now.toISOString().split('T')[0];

    // ============= INTENT CLASSIFICATION =============
    // Check for active drafts to inform intent classification
    const { hasActive: hasActiveDraft, lastToolHint } = await checkForActiveDrafts(walletAddress, supabase);
    
    // Build recent context for classification
    const recentContext = messages.slice(-2).map((m: any) => 
      `${m.role}: ${m.content.substring(0, 150)}`
    ).join('\n');
    
    // Classify user intent BEFORE main AI call
    console.log('[Intent Classification] Starting...');
    const intent = await classifyIntent(
      message,
      userType,
      hasActiveDraft,
      lastToolHint,
      recentContext,
      lovableApiKey
    );
    console.log(`[Intent Classification] Result: ${intent} | hasActiveDraft: ${hasActiveDraft} | userType: ${userType}`);

    // Build system prompt - condensed for speed
    const systemPrompt = `You are Rei, a warm, caring AI assistant for the Rei Proof-Of-Talent Portal. You connect Web3 talent with opportunities.

CURRENT DATE & TIME:
- Today is: ${currentDateReadable}
- Current time: ${currentTimeReadable}
- ISO Date: ${currentISODate}
- Use this to determine "today", "yesterday", "this week" when discussing jobs/tasks

Current user type: ${userType}
User's wallet address: ${walletAddress}
Treasury wallet: ${TREASURY_WALLET}

OPPORTUNITY TYPES:
- JOB: Full-time/part-time employment
- CONTRACT: Fixed-term freelance work
- TASK: One-time deliverables
- BOUNTY: Competitive open tasks
- GIG: Short-term project work
- QUEST: Gamified tasks with rewards

FORMATTING FOR LISTINGS (use clean terminal style):
1. Title Here
> Company | Location | Compensation

Clean 2-3 sentence summary. No emojis.

[TYPE] · Posted X days ago
>> [Apply here](url)

FORMATTING RULES:
- STRIP ALL EMOJIS - convert to clean terminal text
- Title on its OWN line with number prefix (1., 2., 3.)
- > chevron for details line
- Use | to separate items on SAME line
- [text](url) for clickable links
- NO indentation anywhere
- ALWAYS include apply link
- When presenting Rei tasks/bounties returned by search_tasks: DO NOT write the title, chevron details, "[TASK] · Posted X days ago", or "Apply here" link in text. Output ONLY a single [[rei-task:<task.id>]] marker per result, each on its own line. The UI renders a full preview card from the marker. A short intro sentence and short closing sentence around the markers is fine, but no per-task text. Never mention or explain the marker. Only use task IDs you actually received from search_tasks — do not invent UUIDs.
- The cards-only rule applies to Rei tasks (search_tasks results). For external jobs from search_jobs that have no Rei task ID, use the normal terminal listing format above.

CORE RULES:
1. Be warm and personable but concise
2. Payment confirmations: EXACTLY say "Payment ready! Connect your wallet and choose your preferred payment method below."
3. NEVER restart a flow you're already in
4. Call save_draft after EACH field collected
5. When searching, prioritize recent opportunities

STATELESS DESIGN:
- You have MINIMAL history (last 3 messages)
- Use tools for context: check_my_drafts, get_my_profile, load_draft
- Each request should leverage database tools

FLOW STATES: INTENT → COLLECTING → CONFIRMING → PAYMENT → SUCCESS

JOB/TASK POSTING:
- Check drafts first with check_my_drafts
- After confirming all details → generate_solana_pay_qr
- After payment → verify_and_post_job/task → complete_draft
- Tasks REQUIRE a link

CONFIRMING STATE:
- Long text (>100 chars) = Updated description
- "looks good/yes/perfect" = Proceed to payment
- "change X to Y" = Update that field

FOR TALENT:
- Wallet connected (${walletAddress})
- The user IS already registered and authenticated — if you can talk to them, they have an account. NEVER tell them to "register", "create a profile", or "sign up".
- NEVER invent or guess URLs (no app.rei.xyz, no /profile path). The app lives at rei.chat. The only valid in-app route to reference is "/rei".
- If a search returns zero matches, respond warmly and suggest they enrich their profile to improve matching: "Tap your avatar in the top-right and choose Edit Profile to add more skills, role tags, or a portfolio link so I can match you with more opportunities." Do NOT include a link — the avatar button is right there in the UI.
- Only if a search tool explicitly returns {"error":"profile_missing"} (genuinely no rei_registry row) should you mention registration, and even then say: "Looks like your profile didn't finish setting up — please complete the registration step in the app." No external URLs.

PAYMENT: $5 in SOL/SPL tokens → ${TREASURY_WALLET}, earns 10 points

METADATA OUTPUT FORMAT (CRITICAL):
When tools return structured data for UI rendering, DO NOT output it in your response text.
The system will automatically inject the metadata from tool results.
Just write your conversational response - the payment cards and draft buttons will render automatically.

RESTRICTIONS:
- NO alerts/notifications feature
- NO scraping job boards
- DON'T suggest unimplemented features

Be warm and human. Match user energy. Celebrate successes.`;

    // Define tools
    const tools = [
      // === TALENT SEARCH TOOLS ===
      {
        type: "function",
        function: {
          name: "search_jobs",
          description: "Search for job opportunities matching talent's profile. Use when talent asks to 'find jobs', 'show jobs', 'job search'.",
          parameters: {
            type: "object",
            properties: {
              walletAddress: { type: "string", description: "Talent's wallet address" }
            },
            required: ["walletAddress"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_tasks",
          description: "Search for EXISTING task/bounty opportunities. Use ONLY when talent asks to 'find tasks', 'show tasks', 'what bounties are available'. DO NOT use when user says 'post a task' or 'create a task' - use start_paid_task_posting instead.",
          parameters: {
            type: "object",
            properties: {
              walletAddress: { type: "string", description: "Talent's wallet address" }
            },
            required: ["walletAddress"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_my_profile",
          description: "Get user's profile including points, submission history, and stats. Use when user wants to see their profile/points/stats in any phrasing.",
          parameters: {
            type: "object",
            properties: {
              walletAddress: { type: "string", description: "User's wallet address" }
            },
            required: ["walletAddress"]
          }
        }
      },
      
      // === DRAFT MANAGEMENT TOOLS ===
      {
        type: "function",
        function: {
          name: "check_my_drafts",
          description: "Check if user has any in-progress job or task drafts. Use when user says 'post a job' or 'post a task' to see if they have existing drafts to continue.",
          parameters: {
            type: "object",
            properties: {
              walletAddress: { type: "string", description: "User's wallet address" }
            },
            required: ["walletAddress"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "load_draft",
          description: "Load a specific draft by ID to continue working on it",
          parameters: {
            type: "object",
            properties: {
              draftId: { type: "string", description: "Draft ID (UUID)" },
              draftType: { type: "string", enum: ["job", "task"], description: "Type of draft to load" }
            },
            required: ["draftId", "draftType"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "save_draft",
          description: "Save or update draft progress to database. Call after each field is collected or updated.",
          parameters: {
            type: "object",
            properties: {
              walletAddress: { type: "string", description: "User's wallet address" },
              draftType: { type: "string", enum: ["job", "task"], description: "Type of draft" },
              draftId: { type: "string", description: "Draft ID (UUID) if updating existing draft, omit if creating new" },
              data: {
                type: "object",
                description: "Draft data fields to save/update",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  company_name: { type: "string" },
                  compensation: { type: "string" },
                  link: { type: "string" },
                  requirements: { type: "string" },
                  deadline: { type: "string" },
                  end_date: { type: "string" },
                  role_tags: { type: "array", items: { type: "string" } },
                  og_image: { type: "string" },
                  status: { type: "string", enum: ["draft", "confirming", "payment_pending"] }
                }
              }
            },
            required: ["walletAddress", "draftType", "data"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "delete_draft",
          description: "Delete a draft permanently. Use when user says 'delete draft' or 'forget it'.",
          parameters: {
            type: "object",
            properties: {
              draftId: { type: "string", description: "Draft ID (UUID)" },
              draftType: { type: "string", enum: ["job", "task"], description: "Type of draft" }
            },
            required: ["draftId", "draftType"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "complete_draft",
          description: "Delete draft after successful payment and job/task posting. Use after verify_and_post_job or verify_and_post_task succeeds.",
          parameters: {
            type: "object",
            properties: {
              draftId: { type: "string", description: "Draft ID (UUID)" },
              draftType: { type: "string", enum: ["job", "task"], description: "Type of draft" }
            },
            required: ["draftId", "draftType"]
          }
        }
      },
      
      // === POSTING INTENT SIGNALS ===
      {
        type: "function",
        function: {
          name: "start_paid_job_posting",
          description: "Signal that user wants to post a paid job listing. Recognize intent from natural language - any phrasing that means 'I want to create/post/list a job position'. Returns acknowledgment to begin data collection.",
          parameters: {
            type: "object",
            properties: {
              userType: { type: "string", description: "employer or talent" }
            },
            required: ["userType"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "start_paid_task_posting",
          description: "Start CREATING a new task/bounty/gig. Use when user says 'post a task', 'create a task', 'list a bounty', 'I have a gig to post', 'submit a task', 'I need someone to...'. DO NOT use for searching existing tasks.",
          parameters: {
            type: "object",
            properties: {
              userType: { type: "string", description: "employer or talent" }
            },
            required: ["userType"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "start_community_contribution",
          description: "Signal that talent wants to submit job/task as community contribution (earns points). Recognize intent from natural language - any phrasing that means 'I found/saw an opportunity to share with the community'. Use this when user clearly wants to CONTRIBUTE rather than POST their own opportunity.",
          parameters: {
            type: "object",
            properties: {
              submissionType: { 
                type: "string", 
                enum: ["job", "task"],
                description: "Type of opportunity to contribute"
              }
            },
            required: ["submissionType"]
          }
        }
      },
      
      // === EMPLOYER TOOLS ===
      {
        type: "function",
        function: {
          name: "search_talent",
          description: "Search for talent matching job requirements (returns summaries only, payment required for full profiles)",
          parameters: {
            type: "object",
            properties: {
              requirements: { type: "string", description: "Job requirements and description" },
              roleTags: { type: "array", items: { type: "string" }, description: "Required role tags" }
            },
            required: ["requirements"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "extract_og_data",
          description: "Extract Open Graph metadata (title, description, image) from a URL for job/task posting",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "URL to extract metadata from" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "generate_solana_pay_qr",
          description: "Generate Solana Pay QR code for $5 payment. Returns QR code data to be included in message metadata.",
          parameters: {
            type: "object",
            properties: {
              label: { type: "string", description: "Payment label (e.g., 'Job Posting')" },
              message: { type: "string", description: "Payment message for user" }
            },
            required: ["label"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_talent_profile",
          description: "Get full talent profile details after Solana Pay payment verification",
          parameters: {
            type: "object",
            properties: {
              xUserId: { type: "string", description: "Talent's X user ID" },
              reference: { type: "string", description: "Solana Pay reference (unique payment identifier)" },
              employerWallet: { type: "string", description: "Employer's wallet address" }
            },
            required: ["xUserId", "reference", "employerWallet"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "verify_and_post_job",
          description: "Verify Solana Pay payment and post a job",
          parameters: {
            type: "object",
            properties: {
              reference: { type: "string", description: "Solana Pay reference" },
              employerWallet: { type: "string", description: "Employer's or contributor's wallet address" },
              title: { type: "string", description: "Job title" },
              companyName: { type: "string", description: "Company or project name" },
              description: { type: "string", description: "Job description (max 500 chars)" },
              requirements: { type: "string", description: "Job requirements" },
              wage: { type: "string", description: "Wage/pay (optional)" },
              deadline: { type: "string", description: "Application deadline (YYYY-MM-DD format, optional)" },
              link: { type: "string", description: "External job link (optional)" },
              roleTags: { type: "array", items: { type: "string" }, description: "Role tags" },
              source: { type: "string", description: "Source: 'manual' (employer) or 'community_contributed' (talent contributor)" }
            },
            required: ["reference", "employerWallet", "title", "companyName", "description"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "verify_and_post_task",
          description: "Verify Solana Pay payment and post a task",
          parameters: {
            type: "object",
            properties: {
              reference: { type: "string", description: "Solana Pay reference" },
              employerWallet: { type: "string", description: "Employer's or contributor's wallet address" },
              title: { type: "string", description: "Task title" },
              companyName: { type: "string", description: "Company or project name" },
              description: { type: "string", description: "Task description (max 500 chars)" },
              link: { type: "string", description: "Task link" },
              payReward: { type: "string", description: "Pay/reward (optional)" },
              endDate: { type: "string", description: "End date (YYYY-MM-DD format, optional)" },
              roleTags: { type: "array", items: { type: "string" }, description: "Role tags" },
              source: { type: "string", description: "Source: 'manual' (employer) or 'community_contributed' (talent contributor)" }
            },
            required: ["reference", "employerWallet", "title", "companyName", "description", "link"]
          }
        }
      }
    ];

    // ============= FILTER TOOLS BY INTENT =============
    const filteredTools = getToolsForIntent(intent, tools);
    console.log(`[Tool Filtering] Intent: ${intent} | Available tools: ${filteredTools.length}/${tools.length}`);
    
    // Get intent-specific guidance
    const intentGuidance = getIntentGuidance(intent);

    // Call Lovable AI with tool calling - using faster model
    let aiMessages = [
      { role: "system", content: systemPrompt + "\n\n" + intentGuidance },
      ...(messages || [])
    ];

    let maxIterations = 3; // Reduced from 5 for speed
    let iteration = 0;
    let finalResponse = '';

    while (iteration < maxIterations) {
      iteration++;
      console.log(`[Iteration ${iteration}/${maxIterations}] Starting AI processing with ${filteredTools.length} tools...`);

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: aiMessages,
          tools: filteredTools.length > 0 ? filteredTools : undefined,
          tool_choice: filteredTools.length > 0 ? 'auto' : undefined
        })
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI API error:', aiResponse.status, errorText);
        
        if (aiResponse.status === 402) {
          throw new Error('AI credits exhausted. Please add credits to your Lovable workspace to continue using Rei.');
        }
        
        if (aiResponse.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        }
        
        throw new Error(`AI service error (${aiResponse.status}). Please try again.`);
      }

      const aiData = await aiResponse.json();
      const assistantMessage = aiData.choices[0].message;
      console.log(`[Iteration ${iteration}] AI response received. Tool calls:`, assistantMessage.tool_calls?.length || 0);

      // Add assistant message to conversation
      aiMessages.push(assistantMessage);

      // Check if AI wants to call tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Execute tool calls in parallel for speed
        const toolCalls = assistantMessage.tool_calls;
        console.log(`Executing ${toolCalls.length} tool(s) in parallel...`);
        
        // Track metadata to inject from tool results
        let injectedMetadata: any = {};
        
        const toolPromises = toolCalls.map(async (toolCall: any) => {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);
          console.log('Executing tool:', toolName);
          
          let toolResult;
          try {
            const startTime = Date.now();
            toolResult = await executeTool(toolName, toolArgs, supabase);
            const duration = Date.now() - startTime;
            console.log(`Tool ${toolName} completed in ${duration}ms`);
            
            // Capture metadata from specific tool results for programmatic injection
            if (toolName === 'generate_solana_pay_qr' && toolResult?.qrData) {
              injectedMetadata.solanaPay = toolResult.qrData;
              console.log('[Metadata Injection] Captured solanaPay data from generate_solana_pay_qr');
            }
            if (toolName === 'check_my_drafts' && toolResult?.drafts?.length > 0) {
              injectedMetadata.drafts = toolResult.drafts;
              console.log('[Metadata Injection] Captured drafts data from check_my_drafts');
            }
          } catch (error) {
            console.error(`Tool ${toolName} failed:`, error);
            toolResult = { error: error instanceof Error ? error.message : 'Tool execution failed' };
          }
          
          return {
            role: "tool" as any,
            tool_call_id: toolCall.id,
            name: toolName,
            content: JSON.stringify(toolResult)
          };
        });
        
        // Wait for all tools to complete in parallel
        const toolResults = await Promise.all(toolPromises);
        
        // Store injected metadata for later use after final response
        if (Object.keys(injectedMetadata).length > 0) {
          (aiMessages as any)._injectedMetadata = { ...(aiMessages as any)._injectedMetadata, ...injectedMetadata };
        }
        
        // Add all tool results to messages
        for (const result of toolResults) {
          aiMessages.push(result as any);
        }
      } else {
        // No more tool calls, we have the final response
        const content = assistantMessage.content || '';
        console.log(`[Iteration ${iteration}] Final response ready, length:`, content.length);
        
        // Handle empty responses gracefully
        if (!content || content.trim() === '') {
          console.error('[ERROR] AI returned empty content');
          console.error('[ERROR] Last user message:', aiMessages[aiMessages.length - 1]?.content);
          finalResponse = "I apologize, I didn't quite catch that. Could you rephrase what you'd like me to help with?";
        } else {
          finalResponse = content;
        }
        break;
      }
    }

    // PROGRAMMATIC METADATA INJECTION - Use captured tool data first, then fallback to regex
    let metadata: any = null;
    
    // First, use programmatically captured metadata from tool results (most reliable)
    const capturedMetadata = (aiMessages as any)._injectedMetadata;
    if (capturedMetadata && Object.keys(capturedMetadata).length > 0) {
      metadata = { ...capturedMetadata };
      console.log('[Metadata] Injected from tool results:', Object.keys(metadata));
    }
    
    try {
      // Fallback: Try to extract JSON metadata from response text (for backward compatibility)
      
      // Pattern 1: solanaPay metadata
      const solanaPayRegex = /\{\s*["']solanaPay["']\s*:\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\s*\}/;
      const solanaPayMatch = finalResponse.match(solanaPayRegex);
      if (solanaPayMatch && !metadata?.solanaPay) {
        const parsed = JSON.parse(solanaPayMatch[0]);
        metadata = { ...metadata, ...parsed };
        finalResponse = finalResponse.replace(solanaPayMatch[0], '').trim();
      } else if (solanaPayMatch) {
        // Remove from response even if we already have it from injection
        finalResponse = finalResponse.replace(solanaPayMatch[0], '').trim();
      }
      
      // Pattern 2: drafts metadata - {"drafts":[...]}
      const draftsRegex = /\{\s*["']drafts["']\s*:\s*\[[^\]]*\]\s*\}/g;
      const draftsMatch = finalResponse.match(draftsRegex);
      if (draftsMatch && !metadata?.drafts) {
        const draftsData = JSON.parse(draftsMatch[0]);
        metadata = { ...metadata, ...draftsData };
        finalResponse = finalResponse.replace(draftsMatch[0], '').trim();
      } else if (draftsMatch) {
        finalResponse = finalResponse.replace(draftsMatch[0], '').trim();
      }
      
      // Pattern 3: "Metadata: {...}" format that AI sometimes uses
      const metadataLabelRegex = /Metadata:\s*(\{[\s\S]*?\})\s*$/i;
      const metadataLabelMatch = finalResponse.match(metadataLabelRegex);
      if (metadataLabelMatch) {
        try {
          const extractedData = JSON.parse(metadataLabelMatch[1]);
          metadata = { ...metadata, ...extractedData };
          finalResponse = finalResponse.replace(metadataLabelMatch[0], '').trim();
        } catch (parseError) {
          finalResponse = finalResponse.replace(metadataLabelRegex, '').trim();
        }
      }
      
      // Pattern 4: Generic action metadata
      const actionRegex = /\{\s*["']action["']\s*:\s*["'][^"']+["']\s*,\s*["']link["']\s*:\s*["'][^"']+["']\s*\}/;
      const actionMatch = finalResponse.match(actionRegex);
      if (actionMatch) {
        const actionData = JSON.parse(actionMatch[0]);
        metadata = { ...metadata, ...actionData };
        finalResponse = finalResponse.replace(actionMatch[0], '').trim();
      }
      
      // Clean up: Remove raw Solana Pay URLs that AI sometimes outputs
      const rawSolanaPayUrl = /solana:[A-Za-z0-9]+\?[^\s\n]+/g;
      finalResponse = finalResponse.replace(rawSolanaPayUrl, '').trim();
      
      // Clean up any remaining "Metadata:" labels without valid JSON
      finalResponse = finalResponse.replace(/\n*Metadata:\s*$/i, '').trim();
      
    } catch (e) {
      console.error('Failed to extract metadata:', e);
    }

    // Save assistant response
    await supabase
      .from('chat_messages')
      .insert({
        conversation_id: convId,
        role: 'assistant',
        content: finalResponse,
        metadata: metadata
      });

    return new Response(
      JSON.stringify({ 
        response: finalResponse,
        conversationId: convId,
        metadata: metadata
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in rei-chat:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function executeTool(toolName: string, args: any, supabase: any) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

  switch (toolName) {
    case 'search_jobs': {
      // Inline implementation — match-talent-to-jobs edge function does not exist.
      // Mirrors search_tasks but scoped to job-style opportunity_types.
      const { data: talent } = await supabase
        .from('rei_registry')
        .select('*')
        .eq('wallet_address', args.walletAddress)
        .single();

      if (!talent) {
        return { error: 'profile_missing' };
      }

      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        return { error: 'Failed to fetch jobs' };
      }

      const talentCategoryIds: string[] = talent.skill_category_ids || [];
      const talentRoleTags: string[] = (talent.role_tags || []).map((r: string) => String(r).toLowerCase());
      const talentSkills: string[] = (talent.skills || []).map((s: string) => String(s).toLowerCase());

      const scored = (jobs || []).map((j: any) => {
        let score = 0;
        const reasons: string[] = [];

        const jobCatIds: string[] = j.skill_category_ids || [];
        const catOverlap = jobCatIds.filter((c) => talentCategoryIds.includes(c)).length;
        if (catOverlap > 0) {
          score += catOverlap * 10;
          reasons.push(`${catOverlap} matching skill categor${catOverlap === 1 ? 'y' : 'ies'}`);
        }

        const jobRoles: string[] = (j.role_tags || []).map((r: string) => String(r).toLowerCase());
        const roleOverlap = jobRoles.filter((r) => talentRoleTags.includes(r)).length;
        if (roleOverlap > 0) {
          score += roleOverlap * 5;
          reasons.push(`role match: ${jobRoles.filter((r) => talentRoleTags.includes(r)).join(', ')}`);
        }

        const haystack = `${j.title || ''} ${j.description || ''} ${j.requirements || ''}`.toLowerCase();
        const skillHits = talentSkills.filter((s) => s && haystack.includes(s));
        if (skillHits.length > 0) {
          score += skillHits.length * 3;
          reasons.push(`skills mentioned: ${skillHits.slice(0, 3).join(', ')}`);
        }

        return { job: j, score, reasons };
      });

      const matches = scored
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

      return {
        total_active: jobs?.length || 0,
        matches: matches.map(({ job, score, reasons }) => ({
          id: job.id,
          title: job.title,
          company_name: job.company_name,
          compensation: job.compensation,
          opportunity_type: job.opportunity_type,
          link: job.apply_url || job.link,
          deadline: job.deadline,
          posted_at: job.created_at,
          match_score: score,
          match_reasons: reasons,
        })),
      };
    }

    case 'search_tasks': {
      // Search tasks matching talent profile using dynamic skill categories
      const { data: talent } = await supabase
        .from('rei_registry')
        .select('*')
        .eq('wallet_address', args.walletAddress)
        .single();
      
      if (!talent) {
        return { error: 'Talent profile not found. Please register first.' };
      }
      
      // Get all active tasks
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(30);
      
      if (error) {
        return { error: 'Failed to fetch tasks' };
      }
      
      // Get category names for matched IDs
      const talentCategoryIds = talent.skill_category_ids || [];
      const allCategoryIds = [
        ...talentCategoryIds,
        ...tasks.flatMap((t: any) => t.skill_category_ids || [])
      ];
      
      let categoryMap: Record<string, string> = {};
      if (allCategoryIds.length > 0) {
        const { data: categories } = await supabase
          .from('skill_categories')
          .select('id, name')
          .in('id', [...new Set(allCategoryIds)]);
        
        categoryMap = Object.fromEntries(
          (categories || []).map((c: any) => [c.id, c.name])
        );
      }
      
      const matchedTasks = tasks.map((task: any) => {
        let matchScore = 0;
        let matchReasons: string[] = [];
        
        const taskCategoryIds = task.skill_category_ids || [];
        
        // 1. CATEGORY MATCH (50 points max - HIGHEST PRIORITY)
        const matchingCategoryIds = talentCategoryIds.filter(
          (id: string) => taskCategoryIds.includes(id)
        );
        
        if (matchingCategoryIds.length > 0 && taskCategoryIds.length > 0) {
          const categoryScore = Math.min(
            (matchingCategoryIds.length / taskCategoryIds.length) * 50,
            50
          );
          matchScore += categoryScore;
          
          const matchedNames = matchingCategoryIds
            .map((id: string) => categoryMap[id])
            .filter(Boolean)
            .slice(0, 3);
          
          if (matchedNames.length > 0) {
            matchReasons.push(`Matches your categories: ${matchedNames.join(', ')}`);
          }
        }
        
        // 2. Role tag overlap (20 points max)
        const talentTags = talent.role_tags || [];
        const taskTags = task.role_tags || [];
        const matchingTags = talentTags.filter((tag: string) => taskTags.includes(tag));
        
        if (matchingTags.length > 0) {
          matchScore += matchingTags.length * 7;
          matchReasons.push(`Role tags: ${matchingTags.join(', ')}`);
        }
        
        // 3. Wallet activity bonus (15 points max)
        const walletVerification = talent.profile_analysis?.wallet_verification;
        if (walletVerification?.verified) {
          matchScore += 10;
          matchReasons.push('Verified on-chain activity');
        }
        
        // 4. Profile score bonus (10 points max)
        if (talent.profile_score >= 8) matchScore += 10;
        else if (talent.profile_score >= 5) matchScore += 5;
        
        return {
          ...task,
          matchScore: Math.min(matchScore, 100),
          matchReason: matchReasons.join('. ')
        };
      });
      
      // Sort by match score (category matches first)
      matchedTasks.sort((a: any, b: any) => b.matchScore - a.matchScore);
      
      return {
        tasks: matchedTasks.slice(0, 10).map((task: any) => ({
          id: task.id,
          title: task.title,
          company_name: task.company_name,
          description: task.description,
          link: task.link,
          compensation: task.compensation,
          role_tags: task.role_tags,
          created_at: task.created_at,
          opportunity_type: task.opportunity_type || 'task',
          matchScore: task.matchScore,
          matchReason: task.matchReason
        })),
        talentProfile: {
          wallet_address: talent.wallet_address,
          role_tags: talent.role_tags,
          skill_category_ids: talent.skill_category_ids
        }
      };
    }
    
    case 'get_my_profile': {
      // Get user points
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('*')
        .eq('wallet_address', args.walletAddress)
        .single();
      
      // Get talent profile from rei_registry
      const { data: talentProfile } = await supabase
        .from('rei_registry')
        .select('*')
        .eq('wallet_address', args.walletAddress)
        .single();
      
      // Get submission history
      const { data: submissions } = await supabase
        .from('community_submissions')
        .select('*')
        .eq('submitter_wallet', args.walletAddress)
        .order('created_at', { ascending: false })
        .limit(10);
      
      // Get points transactions
      const { data: transactions } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('wallet_address', args.walletAddress)
        .order('created_at', { ascending: false })
        .limit(10);
      
      return {
        points: {
          total: pointsData?.total_points || 0,
          pending: pointsData?.points_pending || 0,
          lifetime_earnings_sol: pointsData?.lifetime_earnings_sol || 0
        },
        talentProfile: talentProfile ? {
          handle: talentProfile.handle,
          displayName: talentProfile.display_name,
          roleTags: talentProfile.role_tags || [],
          skills: talentProfile.skills || [],
          workExperience: talentProfile.work_experience || [],
          profileScore: talentProfile.profile_score,
          analysisSummary: talentProfile.analysis_summary,
          profileAnalysis: talentProfile.profile_analysis
        } : null,
        submissions: submissions || [],
        recent_transactions: transactions || []
      };
    }
    
    case 'check_my_drafts': {
      // Get all job drafts for user
      const { data: jobDrafts } = await supabase
        .from('job_drafts')
        .select('*')
        .eq('wallet_address', args.walletAddress)
        .order('created_at', { ascending: false });
      
      // Get all task drafts for user
      const { data: taskDrafts } = await supabase
        .from('task_drafts')
        .select('*')
        .eq('wallet_address', args.walletAddress)
        .order('created_at', { ascending: false });
      
      const allDrafts = [
        ...(jobDrafts || []).map((d: any) => ({ ...d, type: 'job' })),
        ...(taskDrafts || []).map((d: any) => ({ ...d, type: 'task' }))
      ];
      
      if (allDrafts.length === 0) {
        return { drafts: [], hasDrafts: false };
      }
      
      // Sort by created_at descending
      allDrafts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Add terminal-style indicators
      const indicators = ['[1]', '[2]', '[3]', '[4]', '[5]', '[6]', '[7]', '[8]', '[9]', '[10]'];
      const draftsWithIndicator = allDrafts.map((draft: any, idx: number) => ({
        id: draft.id,
        type: draft.type,
        title: draft.title || `Untitled ${draft.type}`,
        status: draft.status,
        indicator: indicators[idx] || '[+]',
        created_at: draft.created_at
      }));
      
      return {
        drafts: draftsWithIndicator,
        hasDrafts: true,
        message: `Found ${allDrafts.length} draft(s). The UI will automatically show draft selection buttons.`
      };
    }
    
    case 'load_draft': {
      const tableName = args.draftType === 'job' ? 'job_drafts' : 'task_drafts';
      
      const { data: draft, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', args.draftId)
        .single();
      
      if (error || !draft) {
        return { error: 'Draft not found' };
      }
      
      return {
        success: true,
        draft: draft,
        message: `Loaded ${args.draftType} draft: ${draft.title || 'Untitled'}. Current status: ${draft.status}`
      };
    }
    
    case 'save_draft': {
      const tableName = args.draftType === 'job' ? 'job_drafts' : 'task_drafts';
      
      if (args.draftId) {
        // Update existing draft
        const { data: updated, error } = await supabase
          .from(tableName)
          .update({
            ...args.data,
            updated_at: new Date().toISOString()
          })
          .eq('id', args.draftId)
          .select()
          .single();
        
        if (error) {
          return { error: error.message };
        }
        
        return {
          success: true,
          draftId: args.draftId,
          message: `Draft updated successfully`
        };
      } else {
        // Create new draft
        const { data: created, error } = await supabase
          .from(tableName)
          .insert({
            wallet_address: args.walletAddress,
            ...args.data
          })
          .select()
          .single();
        
        if (error) {
          return { error: error.message };
        }
        
        return {
          success: true,
          draftId: created.id,
          message: `New draft created successfully. Draft ID: ${created.id}`
        };
      }
    }
    
    case 'delete_draft': {
      const tableName = args.draftType === 'job' ? 'job_drafts' : 'task_drafts';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', args.draftId);
      
      if (error) {
        return { error: error.message };
      }
      
      return {
        success: true,
        message: `Draft deleted successfully`
      };
    }
    
    case 'complete_draft': {
      const tableName = args.draftType === 'job' ? 'job_drafts' : 'task_drafts';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', args.draftId);
      
      if (error) {
        console.log(`[complete_draft] Error deleting draft: ${error.message}`);
        // Don't fail if draft deletion fails - the posting was successful
      }
      
      return {
        success: true,
        message: `Draft completed and removed from database`
      };
    }
    
    case 'start_paid_job_posting': {
      return {
        success: true,
        message: `Acknowledged: ${args.userType === 'talent' ? 'Talent' : 'Employer'} wants to post a paid job. Begin collecting job details (title, company, description, requirements, wage, deadline). After collection, generate payment QR with generate_solana_pay_qr.`,
        flow: 'paid_job_posting'
      };
    }
    
    case 'start_paid_task_posting': {
      return {
        success: true,
        message: `Acknowledged: ${args.userType === 'talent' ? 'Talent' : 'Employer'} wants to post a paid task. Begin collecting task details (title, company, description, link REQUIRED, pay, end date). After collection, generate payment QR with generate_solana_pay_qr.`,
        flow: 'paid_task_posting'
      };
    }
    
    case 'start_community_contribution': {
      return {
        success: true,
        message: `Acknowledged: Talent wants to contribute a ${args.submissionType}. Explain they'll earn 10 points and follow the same $5 payment flow. Begin collecting ${args.submissionType} details.`,
        flow: 'community_contribution',
        submissionType: args.submissionType
      };
    }

    case 'search_talent': {
      const response = await supabase.functions.invoke('match-jobs-to-talent', {
        body: { 
          requirements: args.requirements,
          roleTags: args.roleTags || []
        }
      });
      return response.data || response.error;
    }

    case 'extract_og_data': {
      const response = await supabase.functions.invoke('extract-og-image', {
        body: { url: args.url }
      });
      
      if (response.error) {
        return { 
          error: 'Failed to extract data from URL',
          details: response.error 
        };
      }
      
      const { og_title, og_description, og_image, errorType } = response.data || {};
      
      // If we got an error type, provide specific guidance
      if (errorType) {
        let userMessage = '';
        switch (errorType) {
          case 'BLOCKED':
            userMessage = 'This site (likely LinkedIn or Indeed) blocks automated data extraction. Please manually enter the job details instead.';
            break;
          case 'TIMEOUT':
            userMessage = 'The page took too long to load. Please try again or enter details manually.';
            break;
          case 'NOT_FOUND':
            userMessage = "That URL doesn't seem to exist. Please check the link and try again.";
            break;
          default:
            userMessage = 'Could not extract data from that URL. Please enter the details manually.';
        }
        return { 
          error: userMessage,
          errorType: errorType 
        };
      }
      
      return {
        title: og_title || '',
        description: og_description || '',
        image: og_image || '',
        hasData: !!(og_title || og_description)
      };
    }

    case 'generate_solana_pay_qr': {
      console.log('[generate_solana_pay_qr] Starting QR generation...');
      // Generate truly unique reference using crypto
      const QRCode = await import("npm:qrcode@^1.5.3");
      const { Keypair } = await import("npm:@solana/web3.js@^1.98.4");
      
      // Generate a unique keypair and use its public key as reference
      const keypair = Keypair.generate();
      const reference = keypair.publicKey.toString();
      console.log('[generate_solana_pay_qr] Generated reference:', reference);
      
      const usdAmount = 5; // $5 USD
      const recipient = '5JXJQSFZMxiQNmG4nx3bs2FnoZZsgz6kpVrNDxfBjb1s';
      
      // Fetch current SOL price in USD with retry logic
      console.log(`[generate_solana_pay_qr] Fetching SOL price for $${usdAmount} USD...`);
      let solPriceUsd = 0;
      const maxRetries = 3;
      const timeout = 10000; // 10 seconds
      const fallbackPrice = 100;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[generate_solana_pay_qr] Attempt ${attempt}/${maxRetries}: CoinGecko request started`);
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
            console.log(`[generate_solana_pay_qr] Attempt ${attempt}/${maxRetries}: Failed - HTTP ${priceResponse.status} ${priceResponse.statusText}`);
            
            if (priceResponse.status === 429) {
              console.log('[generate_solana_pay_qr] Rate limited by CoinGecko');
            } else if (priceResponse.status === 503 || priceResponse.status === 502) {
              console.log('[generate_solana_pay_qr] CoinGecko service unavailable');
            }
            
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
            continue;
          }
          
          const priceData = await priceResponse.json();
          solPriceUsd = priceData?.solana?.usd || 0;
          
          if (solPriceUsd > 0 && solPriceUsd >= 10 && solPriceUsd <= 1000) {
            console.log(`[generate_solana_pay_qr] Attempt ${attempt}/${maxRetries}: Success - SOL price $${solPriceUsd} (response time: ${responseTime}ms)`);
            break;
          } else {
            console.log(`[generate_solana_pay_qr] Attempt ${attempt}/${maxRetries}: Invalid price data: ${solPriceUsd}`);
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.log(`[generate_solana_pay_qr] Attempt ${attempt}/${maxRetries}: Request timed out`);
          } else {
            console.log(`[generate_solana_pay_qr] Attempt ${attempt}/${maxRetries}: Network error - ${error.message}`);
          }
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      
      // Use fallback price if all retries failed
      if (solPriceUsd === 0 || solPriceUsd < 10 || solPriceUsd > 1000) {
        console.log(`[generate_solana_pay_qr] All retries exhausted. Using fallback price $${fallbackPrice}`);
        solPriceUsd = fallbackPrice;
      }
      
      const solAmount = usdAmount / solPriceUsd;
      console.log(`[generate_solana_pay_qr] Converted $${usdAmount} USD to ${solAmount} SOL${solPriceUsd === fallbackPrice ? ' (FALLBACK PRICE)' : ''}`)
      
      // Create Solana Pay URL (accepts SOL by default)
      // Note: Wallet apps can send SPL tokens instead if they support it
      const paymentUrl = `solana:${recipient}?amount=${solAmount.toFixed(9)}&reference=${reference}&label=${encodeURIComponent(args.label)}&message=${encodeURIComponent(args.message || 'Payment for Rei Portal')}`;
      
      console.log('[generate_solana_pay_qr] Generating QR code...');
      // Generate QR code with custom colors
      const qrCodeUrl = await QRCode.default.toDataURL(paymentUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#181818',  // Foreground dots
          light: '#ed565a'  // Background
        }
      });
      
      console.log('[generate_solana_pay_qr] QR code generated successfully');
      // Return QR data as JSON string that will be parsed by AI
      const qrData = {
        qrCodeUrl,
        reference,
        paymentUrl,
        amount: usdAmount,
        solAmount,
        recipient
      };
      
      return {
        success: true,
        qrData: qrData,
        message: `Payment ready for $${usdAmount} USD (~${solAmount.toFixed(4)} SOL). The payment method selector will appear automatically. Tell the user: "Payment ready! Connect your wallet and choose your preferred payment method below."`
      };
    }

    case 'get_talent_profile': {
      // Verify payment first
      const verifyResponse = await supabase.functions.invoke('verify-solana-pay', {
        body: {
          reference: args.reference,
          walletAddress: args.employerWallet
        }
      });

      if (!verifyResponse.data?.verified) {
        return { error: verifyResponse.data?.error || 'Payment verification failed' };
      }

      // Check if reference already used
      const { data: existingView } = await supabase
        .from('talent_views')
        .select('id')
        .eq('payment_tx_signature', verifyResponse.data.signature)
        .single();

      if (existingView) {
        return { error: 'Payment already used for another profile view' };
      }

      // Get full profile
      const { data: talent } = await supabase
        .from('rei_registry')
        .select('*')
        .eq('x_user_id', args.xUserId)
        .single();

      if (!talent) {
        return { error: 'Talent profile not found' };
      }

      // Record the view
      await supabase
        .from('talent_views')
        .insert({
          employer_wallet: args.employerWallet,
          talent_x_user_id: args.xUserId,
          payment_tx_signature: verifyResponse.data.signature
        });

      // Award points
      await supabase.functions.invoke('award-payment-points', {
        body: {
          walletAddress: args.employerWallet,
          reference: args.reference,
          amount: verifyResponse.data.amount,
          tokenMint: verifyResponse.data.tokenMint,
          tokenAmount: verifyResponse.data.tokenAmount
        }
      });

      return { talent, pointsAwarded: 10 };
    }

    case 'verify_and_post_job': {
      // Verify payment
      const verifyResponse = await supabase.functions.invoke('verify-solana-pay', {
        body: {
          reference: args.reference,
          walletAddress: args.employerWallet
        }
      });

      if (!verifyResponse.data?.verified) {
        return { error: verifyResponse.data?.error || 'Payment verification failed' };
      }

      // Insert job (unique constraint will prevent duplicates)
      const { data: job, error } = await supabase
        .from('jobs')
        .insert({
          title: args.title,
          company_name: args.companyName,
          description: args.description,
          requirements: args.requirements || '',
          role_tags: args.roleTags || [],
          compensation: args.wage || args.compensation || '',
          deadline: args.deadline || null,
          link: args.link || null,
          employer_wallet: args.employerWallet,
          payment_tx_signature: verifyResponse.data.signature,
          solana_pay_reference: args.reference,
          source: args.source || 'manual'
        })
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation (23505) - payment already used
        if (error.code === '23505') {
          return { error: 'Payment already used for another job posting' };
        }
        return { error: error.message };
      }

      // Award points (will also handle race condition via unique constraint)
      await supabase.functions.invoke('award-payment-points', {
        body: {
          walletAddress: args.employerWallet,
          reference: args.reference,
          amount: verifyResponse.data.amount,
          tokenMint: verifyResponse.data.tokenMint,
          tokenAmount: verifyResponse.data.tokenAmount
        }
      });

      return { success: true, job, pointsAwarded: 10 };
    }

    case 'verify_and_post_task': {
      // Verify payment
      const verifyResponse = await supabase.functions.invoke('verify-solana-pay', {
        body: {
          reference: args.reference,
          walletAddress: args.employerWallet
        }
      });

      if (!verifyResponse.data?.verified) {
        return { error: verifyResponse.data?.error || 'Payment verification failed' };
      }

      // Insert task (unique constraint will prevent duplicates)
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          title: args.title,
          company_name: args.companyName,
          description: args.description,
          link: args.link,
          role_tags: args.roleTags || [],
          compensation: args.payReward || args.compensation || '',
          end_date: args.endDate || null,
          employer_wallet: args.employerWallet,
          payment_tx_signature: verifyResponse.data.signature,
          solana_pay_reference: args.reference,
          source: args.source || 'manual'
        })
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation (23505) - payment already used
        if (error.code === '23505') {
          return { error: 'Payment already used for another task posting' };
        }
        return { error: error.message };
      }

      // Award points (will also handle race condition via unique constraint)
      await supabase.functions.invoke('award-payment-points', {
        body: {
          walletAddress: args.employerWallet,
          reference: args.reference,
          amount: verifyResponse.data.amount,
          tokenMint: verifyResponse.data.tokenMint,
          tokenAmount: verifyResponse.data.tokenAmount
        }
      });

      return { success: true, task, pointsAwarded: 10 };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}
