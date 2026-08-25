import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You convert a business owner's messy spoken description of a task into a clean, clear SOP a delegate could follow. Keep steps simple and concrete. Choose the most fitting generic role for who should own this task — never name a specific company or brand. Return only the JSON object, nothing else.

Return ONLY valid JSON in this exact shape:
{
  "title": "short SOP title",
  "steps": ["step 1", "step 2", "step 3"],
  "owner_role": "one of: General VA, Tech VA, Bookkeeper, Social Media VA, Customer Service VA, Executive Assistant, or Specialist",
  "why_not_you": "one warm sentence on why the owner shouldn't be the one doing this"
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userText } = await req.json();

    if (!userText) {
      throw new Error("Missing userText");
    }

    // Initialize Supabase client to fetch settings using the service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the OpenAI API key from app_settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'OPENAI_API_KEY')
      .single();

    if (settingsError || !settingsData || !settingsData.value) {
      throw new Error("OpenAI API Key is not configured. Ask an admin to set it.");
    }

    const apiKey = settingsData.value;

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userText }
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '';

    // Clean JSON
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const parsedData = JSON.parse(cleaned);

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
