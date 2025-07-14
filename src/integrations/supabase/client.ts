
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { env } from '@/lib/envValidation';

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = env.VITE_SUPABASE_ANON_KEY;

// Runtime validation for critical environment variables
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing required Supabase configuration. Please check your environment variables.');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce',
    debug: env.VITE_ENVIRONMENT === 'development' || env.VITE_ENVIRONMENT === 'staging'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-client-info': 'runners-home-exchange@1.0.0'
    }
  }
});
