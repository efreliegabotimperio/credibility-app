import { supabase } from './supabase';

export async function generateSOP(userText) {
  const { data, error } = await supabase.functions.invoke('generate-sop', {
    body: { userText }
  });

  if (error) {
    throw new Error(error.message || 'Error generating SOP');
  }

  return data;
}
