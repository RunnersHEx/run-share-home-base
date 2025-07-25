
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
    },
    // Enhanced WebSocket configuration for better reliability
    timeout: 20000, // 20 seconds timeout
    heartbeatIntervalMs: 30000, // 30 seconds heartbeat
    reconnectAfterMs: (tries: number) => {
      // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
      return Math.min(1000 * Math.pow(2, tries), 30000);
    }
  },
  global: {
    headers: {
      'x-client-info': 'runners-home-exchange@1.0.0'
    }
  }
});
