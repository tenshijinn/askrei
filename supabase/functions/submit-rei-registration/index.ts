import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegistrationData {
  x_user_id?: string;
  handle?: string;
  display_name?: string;
  profile_image_url?: string;
  verified?: boolean;
  wallet_address: string;
  file_path: string;
  portfolio_url?: string;
  role_tags: string[];
  consent: boolean;
  reanalyze?: boolean; // Flag to force re-analysis with existing transcript
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const registrationData: RegistrationData = await req.json();

    console.log('Submitting registration for:', registrationData.handle || registrationData.wallet_address);
    console.log('Reanalyze mode:', registrationData.reanalyze);

    // Server-side enforcement: only verified X accounts can register (skip for reanalyze)
    if (!registrationData.reanalyze && !registrationData.verified) {
      return new Response(
        JSON.stringify({ error: 'Only verified X (Twitter) accounts can register with Rei.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if file is audio/video and needs transcription
    let processedFilePath = registrationData.file_path;
    const isAudioVideo = registrationData.file_path.match(/\.(webm|mp4|mov|mp3|wav|m4a)$/i);
    
    // For reanalyze mode, skip transcription if we already have a transcript
    const isExistingTranscript = registrationData.file_path.endsWith('_transcript.txt') || registrationData.file_path.endsWith('.txt');
    
    if (isAudioVideo && !registrationData.reanalyze) {
      console.log('Audio/video detected, attempting transcription...');
      
      try {
        // Call transcribe-video function
        const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke('transcribe-video', {
          body: { filePath: registrationData.file_path }
        });

        if (transcribeError) {
          console.warn('Transcription not available, continuing without it:', transcribeError);
          // Continue without transcription
        } else if (transcribeData?.text) {
          console.log('Video transcribed successfully');
          
          // Save transcription as text file
          const textContent = transcribeData.text;
          const textBlob = new Blob([textContent], { type: 'text/plain' });
          const textFileName = registrationData.file_path.replace(/\.(webm|mp4|mov|mp3|wav|m4a)$/i, '_transcript.txt');
          
          const { error: uploadError } = await supabase.storage
            .from('rei-contributor-files')
            .upload(textFileName, textBlob);

          if (uploadError) {
            console.error('Failed to save transcript:', uploadError);
            // Continue anyway, we'll use the video file
          } else {
            processedFilePath = textFileName;
            console.log('Transcript saved as:', textFileName);
          }
        }
      } catch (transcriptionError) {
        console.warn('Transcription failed, continuing without it:', transcriptionError);
        // Don't throw - allow registration to proceed without transcription
      }
    } else if (registrationData.reanalyze && isAudioVideo) {
      // In reanalyze mode with audio file, check if transcript already exists
      const transcriptFileName = registrationData.file_path.replace(/\.(webm|mp4|mov|mp3|wav|m4a)$/i, '_transcript.txt');
      const { data: existingTranscript } = await supabase.storage
        .from('rei-contributor-files')
        .download(transcriptFileName);
      
      if (existingTranscript) {
        processedFilePath = transcriptFileName;
        console.log('Using existing transcript:', transcriptFileName);
      }
    }

    // Run AI analysis if we have a transcript (always run in reanalyze mode, or for new transcripts)
    let profileAnalysis = null;
    let analysisSummary = null;
    let profileScore = null;

    const shouldAnalyze = processedFilePath.endsWith('_transcript.txt') || processedFilePath.endsWith('.txt');
    
    if (shouldAnalyze) {
      console.log('Running AI analysis on transcript...', registrationData.reanalyze ? '(reanalyze mode)' : '');
      
      try {
        // Get the transcript content
        const { data: transcriptData, error: downloadError } = await supabase.storage
          .from('rei-contributor-files')
          .download(processedFilePath);

        if (!downloadError && transcriptData) {
          const transcriptText = await transcriptData.text();
          
          // Call analyze-rei-profile function
          const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-rei-profile', {
            body: {
              transcript: transcriptText,
              walletAddress: registrationData.wallet_address,
              roleTags: registrationData.role_tags
            }
          });

          if (!analysisError && analysisData?.analysis) {
            profileAnalysis = analysisData.analysis;
            analysisSummary = analysisData.analysis.summary;
            profileScore = analysisData.analysis.overall_score;
            console.log('AI analysis completed. Score:', profileScore);
          } else {
            console.warn('Analysis failed:', analysisError);
          }
        }
      } catch (analysisError) {
        console.warn('Failed to run AI analysis:', analysisError);
        // Continue without analysis
      }
    }

    // Extract skills and work experience from profile_analysis
    let skills: string[] = [];
    let workExperience: any[] = [];

    if (profileAnalysis) {
      // Extract technologies as skills
      if (profileAnalysis.notable_mentions?.technologies) {
        skills = profileAnalysis.notable_mentions.technologies;
        console.log('Extracted skills:', skills);
      }
      
      // Extract experience highlights as work experience
      if (profileAnalysis.experience_highlights) {
        workExperience = profileAnalysis.experience_highlights.map((exp: string) => ({
          description: exp
        }));
        console.log('Extracted work experience:', workExperience.length, 'items');
      }
    }

    // Upsert registration data - use x_user_id for conflict since users can update their wallet
    const { data, error } = await supabase
      .from('rei_registry')
      .upsert(
        {
          x_user_id: registrationData.x_user_id,
          handle: registrationData.handle,
          display_name: registrationData.display_name,
          profile_image_url: registrationData.profile_image_url,
          verified: registrationData.verified,
          wallet_address: registrationData.wallet_address,
          file_path: processedFilePath,
          portfolio_url: registrationData.portfolio_url,
          role_tags: registrationData.role_tags,
          consent: registrationData.consent,
          profile_analysis: profileAnalysis,
          analysis_summary: analysisSummary,
          profile_score: profileScore,
          skills: skills,
          work_experience: workExperience,
        },
        { 
          onConflict: 'x_user_id',
          ignoreDuplicates: false 
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Registration successful:', data.id);

    // TODO: Trigger NFT minting
    // This would call a Solana program to mint an SBT to the wallet_address
    // For now, we'll just log it
    console.log('NFT mint placeholder for wallet:', registrationData.wallet_address);

    return new Response(
      JSON.stringify({
        success: true,
        registration: data,
        message: 'Registration successful! Your Proof-of-Talent NFT will be minted shortly.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

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