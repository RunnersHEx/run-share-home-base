
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://tufikuyzllmrfinvmltt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZmlrdXl6bGxtcmZpbnZtbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MDk2MTUsImV4cCI6MjA2NTQ4NTYxNX0.5HmCwwu6MV_0swNIV92vC-IQXyT1aCMUcN-qJW_V0Bg";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce'
  }
});
