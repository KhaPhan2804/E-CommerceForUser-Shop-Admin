import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = "https://njulzxtvzglbrsxdgbcq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdWx6eHR2emdsYnJzeGRnYmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NjM1NzUsImV4cCI6MjA1MDUzOTU3NX0.3i5SUab_MidI9Ywvi8rEQlCSKYZF-myUm8DPFZmRs_w";

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;

export const getJwtToken = async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting session:', error.message);
    return null;
  }

  const jwtToken = data?.session?.access_token; // Access the token
  return jwtToken;
};