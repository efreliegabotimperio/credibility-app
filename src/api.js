import { supabase } from './supabase';

export async function generateSOP(userText) {
  const { data, error } = await supabase.functions.invoke('generate-sop', {
    body: { userText }
  });

  if (error) {
    let errorMessage = error.message;
    try {
      if (error.context) {
        const errData = await error.context.json();
        if (errData.error) errorMessage = errData.error;
      }
    } catch(e) {}
    console.error("Edge Function Error Details:", error);
    throw new Error(errorMessage || 'Error generating SOP');
  }

  return data;
}
