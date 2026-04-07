const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  transcript: string;
  walletAddress: string;
  roleTags: string[];
}

// Define tools for Lovable AI that will call Moralis API directly
const moralisTools = [
  {
    type: "function",
    function: {
      name: "getWalletPortfolio",
      description: "Fetch Solana wallet portfolio overview from Moralis including balance, tokens, and NFT summary",
      parameters: {
        type: "object",
        properties: {
          address: { 
            type: "string", 
            description: "Solana wallet address to query" 
          }
        },
        required: ["address"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getWalletSwaps",
      description: "Fetch Solana wallet swap history from Moralis to analyze trading activity and DeFi interactions",
      parameters: {
        type: "object",
        properties: {
          address: { 
            type: "string", 
            description: "Solana wallet address to query" 
          }
        },
        required: ["address"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getWalletTokens",
      description: "Fetch Solana wallet token holdings from Moralis to check token diversity and DeFi participation",
      parameters: {
        type: "object",
        properties: {
          address: { 
            type: "string", 
            description: "Solana wallet address to query" 
          }
        },
        required: ["address"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getWalletNFTs",
      description: "Fetch Solana wallet NFT holdings from Moralis to verify NFT collection activity and ecosystem engagement",
      parameters: {
        type: "object",
        properties: {
          address: { 
            type: "string", 
            description: "Solana wallet address to query" 
          }
        },
        required: ["address"]
      }
    }
  }
];

// Execute Moralis API calls directly
async function executeMoralisAPI(toolName: string, params: any) {
  const moralisApiKey = Deno.env.get('MORALIS_API_KEY');
  if (!moralisApiKey) {
    console.error('MORALIS_API_KEY not configured');
    return { error: 'Moralis API key not configured' };
  }

  const { address } = params;
  
  // Map tool names to Moralis API endpoints
  const endpointMap: Record<string, string> = {
    'getWalletPortfolio': `https://solana-gateway.moralis.io/account/mainnet/${address}/portfolio`,
    'getWalletSwaps': `https://solana-gateway.moralis.io/account/mainnet/${address}/swaps`,
    'getWalletTokens': `https://solana-gateway.moralis.io/account/mainnet/${address}/tokens`,
    'getWalletNFTs': `https://solana-gateway.moralis.io/account/mainnet/${address}/nft`
  };

  const endpoint = endpointMap[toolName];
  if (!endpoint) {
    console.error(`Unknown tool: ${toolName}`);
    return { error: `Unknown tool: ${toolName}` };
  }

  console.log(`Calling Moralis API: ${toolName} for address ${address}`);
  
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 
        'X-API-Key': moralisApiKey,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Moralis API ${toolName} failed:`, response.status, errorText);
      return { error: `Moralis API ${toolName} failed: ${response.status}` };
    }
    
    const result = await response.json();
    console.log(`Moralis API ${toolName} succeeded with ${JSON.stringify(result).length} bytes`);
    return result;
  } catch (error) {
    console.error(`Failed to call Moralis API ${toolName}:`, error);
    return { error: `Failed to execute ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const { transcript, walletAddress, roleTags }: AnalysisRequest = await req.json();

    console.log('Analyzing profile for wallet:', walletAddress);

    // Enhanced AI system prompt with wallet verification capabilities
    const systemPrompt = `You are an expert Web3 talent evaluator with access to blockchain data tools.

Evaluation Criteria:
1. **Communication Quality** (0-25): Clarity, professionalism, confidence
2. **Web3 Experience** (0-25): Demonstrated knowledge, specific projects mentioned, blockchain understanding
3. **Technical Skills** (0-25): Relevant skills for stated roles, depth of expertise
4. **Role Fit** (0-25): Alignment with selected roles, potential contribution value

When a Solana wallet address is provided, you MUST use the available tools to verify wallet history:
1. Use getWalletPortfolio to get overview of wallet balance and holdings
2. Use getWalletSwaps to analyze trading history and DeFi activity patterns
3. Use getWalletTokens to check token holdings and diversity
4. Use getWalletNFTs to verify NFT collections and ecosystem engagement

IMPORTANT: If any wallet tool calls fail, continue with the analysis using available data. Do not let API failures prevent you from completing the analysis.

PROJECT IDENTIFICATION - You MUST analyze the data returned from tools and identify specific projects:

**From getWalletSwaps data:**
- Look for DEX platform names, program IDs, and swap destinations in the transaction data
- Common Solana DEX Platforms: Jupiter, Raydium, Orca, Serum, Phoenix, Lifinity, Meteora, Aldrin, Saber, Mercurial
- Label each as: "[Project Name] (DEX)"

**From getWalletNFTs data:**
- Extract NFT collection names from the metadata, name field, or symbol
- Common Solana NFT Collections: Mad Lads, Tensorians, DeGods, y00ts, SMB (Solana Monkey Business), Okay Bears, ABC (Attic Babies Collection), Cets on Creck, Famous Fox Federation, Claynosaurz
- Common NFT Marketplaces (if found in transaction history): Magic Eden, Tensor, Solanart, Exchange Art, Holaplex
- Label collections as: "[Collection Name] (NFT Collection)"
- Label marketplaces as: "[Marketplace Name] (NFT Marketplace)"

**From getWalletTokens data:**
- Identify known project tokens by their symbol or name
- Common DeFi Protocols: Marinade Finance (mSOL), Lido (stSOL), Solend, Mango Markets, Drift Protocol, Kamino, Hubble Protocol, Port Finance, Tulip Protocol, Francium
- Memecoins: BONK, WIF (dogwifhat), SAMO, MYRO
- Stablecoins: USDC, USDT, USDH
- Label DeFi as: "[Protocol Name] (DeFi/Staking/Lending)"
- Label Memecoins as: "[Token Name] (Memecoin)"

**Instructions:**
- Parse ALL available data from the Moralis tools to extract project identifiers
- Match contract addresses, program IDs, token symbols, and NFT metadata against the knowledge base above
- Return specific, labeled project names in the notable_interactions array
- If you identify a project not in the list above, still include it with an appropriate label
- For unknown or unlabeled addresses, you may skip them
- Focus on well-known and reputable projects that demonstrate Web3 expertise

Analyze blockchain data to calculate:
- **Account age**: Days since first transaction (from portfolio or swaps data)
- **Transaction patterns**: Frequency and activity level from swap history
- **Notable interactions**: Array of identified project names with labels (e.g., "Jupiter (DEX)", "Mad Lads (NFT Collection)")
- **Bluechip score** (0-100) based on:
  * Account age: 3+ years = 40pts, 2+ years = 30pts, 1+ year = 20pts
  * Swap count: 100+ = 30pts, 50+ = 20pts, 10+ = 10pts
  * Token diversity: 10+ = 15pts, 5+ = 10pts, 1+ = 5pts
  * NFT holdings: 20+ = 15pts, 10+ = 10pts, 1+ = 5pts

CRITICAL: You MUST return ONLY valid JSON with no additional text, commentary, or explanation before or after the JSON object.

After analyzing the transcript and wallet data, provide your complete analysis in this exact JSON structure:
{
  "overall_score": <number 0-100, boost by up to 15 points based on bluechip_score>,
  "category_scores": {
    "communication": <number 0-25>,
    "web3_experience": <number 0-25>,
    "technical_skills": <number 0-25>,
    "role_fit": <number 0-25>
  },
  "key_strengths": [<array of 3-5 brief strength statements>],
  "experience_highlights": [<array of 2-4 specific experiences or projects mentioned>],
  "recommended_improvements": [<array of 2-3 actionable suggestions>],
  "summary": "<2-3 sentence professional summary of the candidate>",
  "notable_mentions": {
    "projects": [<array of Web3 projects mentioned>],
    "technologies": [<array of technologies/tools mentioned>],
    "achievements": [<array of achievements or contributions mentioned>]
  },
  "wallet_verification": {
    "verified": <boolean>,
    "chain": "Solana",
    "first_transaction": "<ISO date string>",
    "account_age_days": <number>,
    "transaction_count": <number>,
    "token_count": <number>,
    "nft_count": <number>,
    "bluechip_score": <number 0-100>,
    "notable_interactions": [<array of labeled project names>]
  }
}

If wallet verification fails or no wallet is provided, set wallet_verification.verified to false and use 0 for numeric fields.

REMINDER: Return ONLY the JSON object above. No other text, explanations, or commentary.`;

    const userPrompt = `Selected Roles: ${roleTags.join(', ')}
${walletAddress ? `\nSolana Wallet Address: ${walletAddress}` : ''}

Video Transcript:
${transcript}

Please analyze this contributor's profile based on their video introduction${walletAddress ? ' and verify their wallet history using the available tools' : ''}.`;

    // Initialize conversation messages
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    let finalAnalysis = null;
    let iterationCount = 0;
    const maxIterations = 10; // Prevent infinite loops

    console.log('Starting AI analysis with Moralis API tool calling...');

    // Tool calling loop
    while (!finalAnalysis && iterationCount < maxIterations) {
      iterationCount++;
      console.log(`AI iteration ${iterationCount}...`);

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages,
          tools: walletAddress ? moralisTools : undefined, // Only enable tools if wallet provided
          tool_choice: walletAddress ? 'auto' : undefined
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('Lovable AI error:', aiResponse.status, errorText);
        throw new Error(`AI analysis failed: ${errorText}`);
      }

      const aiData = await aiResponse.json();
      const assistantMessage = aiData.choices[0].message;

      // Check if AI wants to use tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log(`AI requesting ${assistantMessage.tool_calls.length} tool calls`);
        
        // Add assistant's message with tool calls to conversation
        messages.push(assistantMessage);

        // Execute all tool calls
        for (const toolCall of assistantMessage.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);
          
          console.log(`Executing tool: ${toolName}`, toolArgs);
          
          // Execute Moralis API call
          const toolResult = await executeMoralisAPI(toolName, toolArgs);
          
          // Add tool result to conversation
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolName,
            content: JSON.stringify(toolResult)
          });
        }
      } else {
        // AI has finished and returned final analysis
        console.log('AI analysis complete');
        const analysisText = assistantMessage.content;
        
        try {
          finalAnalysis = JSON.parse(analysisText);
        } catch (parseError) {
          console.error('Failed to parse AI response as JSON:', analysisText);
          throw new Error('AI returned invalid JSON response');
        }
      }
    }

    if (!finalAnalysis) {
      throw new Error('AI analysis exceeded maximum iterations');
    }

    console.log('Analysis complete. Overall score:', finalAnalysis.overall_score);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: finalAnalysis,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-rei-profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
