import { z } from 'zod';

// Simple startup logger for environment validation
const startupLog = {
  success: (message: string) => {
    console.log(`✅ ${message}`);
  },
  error: (message: string) => {
    console.error(`❌ ${message}`);
  },
  detail: (message: string) => {
    console.error(`  - ${message}`);
  }
};

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  VITE_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_GA_TRACKING_ID: z.string().optional(),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_EMAILJS_SERVICE_ID: z.string().optional(),
  VITE_EMAILJS_TEMPLATE_ID: z.string().optional(),
  VITE_EMAILJS_PUBLIC_KEY: z.string().optional(),
});

type Environment = z.infer<typeof envSchema>;

function validateEnvironment(): Environment {
  try {
    return envSchema.parse({
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      VITE_ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT,
      VITE_GA_TRACKING_ID: import.meta.env.VITE_GA_TRACKING_ID,
      VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
      VITE_EMAILJS_SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID,
      VITE_EMAILJS_TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      VITE_EMAILJS_PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
    });
  } catch (error) {
    startupLog.error('Environment validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        startupLog.detail(`${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Invalid environment configuration. Check your .env file.');
  }
}

export const env = validateEnvironment();

// Environment-specific helper messages
if (env.VITE_ENVIRONMENT === 'development') {
  startupLog.success('Environment variables validated successfully - DEVELOPMENT MODE');
} else if (env.VITE_ENVIRONMENT === 'staging') {
  startupLog.success('Environment variables validated successfully - STAGING MODE');
} else if (env.VITE_ENVIRONMENT === 'production') {
  startupLog.success('Environment variables validated successfully - PRODUCTION MODE');
}
