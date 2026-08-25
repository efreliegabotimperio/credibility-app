// @ts-nocheck
// @ts-ignore: Deno import handled by supabase/functions/deno.json
import { serve } from 'http/server.ts';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a professional writing editor and business process expert.

Analyse the user's message. If it asks you to REWRITE, EDIT, IMPROVE, or REFINE some text (e.g. an email, proposal, message, or any piece of writing), treat it as a WRITING EDIT task.
If it asks you to DOCUMENT, LIST STEPS for, or CREATE AN SOP for a business process, treat it as an SOP task.

For a WRITING EDIT task, return ONLY valid JSON in this exact shape:
{
  "type": "edit",
  "title": "short descriptive title for what was edited",
  "edited_text": "the fully rewritten text, preserving the original structure (subject line, greeting, body, sign-off if it was an email)"
}

For an SOP task, return ONLY valid JSON in this exact shape:
{
  "type": "sop",
  "title": "short SOP title",
  "steps": ["step 1", "step 2", "step 3"],
  "owner_role": "one of: General VA, Tech VA, Bookkeeper, Social Media VA, Customer Service VA, Executive Assistant, or Specialist",
  "why_not_you": "one warm sentence on why the owner shouldn't be the one doing this"
}

Return ONLY the JSON object, nothing else.`;

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
