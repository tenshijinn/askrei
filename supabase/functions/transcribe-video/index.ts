import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { filePath } = await req.json();

    console.log('Transcribing audio/video from:', filePath);

    // Download audio/video file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('rei-contributor-files')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error('Failed to download audio/video file');
    }

    console.log('File downloaded, size:', fileData.size);

    // Check file size (Whisper API has 25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (fileData.size > maxSize) {
      throw new Error(`File too large (${(fileData.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 25MB. Please record a shorter audio.`);
    }

    // Prepare form data for Whisper API
    const formData = new FormData();
    formData.append('file', fileData, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'json');

    console.log('Calling Whisper API...');

    // Call OpenAI Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('Whisper API error:', whisperResponse.status, errorText);
      throw new Error(`Whisper API error: ${whisperResponse.status}`);
    }

    const transcription = await whisperResponse.json();
    console.log('Transcription completed, length:', transcription.text?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        text: transcription.text,
        duration: transcription.duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transcribe-video function:', error);
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
