
// Configuración específica para producción
export const PRODUCTION_CONFIG = {
  // Rate limiting configuration
  RATE_LIMITS: {
    AUTH_ATTEMPTS: 5, // intentos por minuto
    BOOKING_REQUESTS: 3, // solicitudes por minuto
    SEARCH_QUERIES: 30, // búsquedas por minuto
    MESSAGE_SENDING: 10 // mensajes por minuto
  },
  
  // Cache configuration
  CACHE_TTL: {
    RACE_SEARCH: 5 * 60 * 1000, // 5 minutos
    USER_PROFILE: 10 * 60 * 1000, // 10 minutos
    PROPERTY_DETAILS: 15 * 60 * 1000, // 15 minutos
    POPULAR_CONTENT: 30 * 60 * 1000 // 30 minutos
  },
  
  // Performance thresholds
  PERFORMANCE: {
    MAX_LOAD_TIME: 3000, // 3 segundos
    MAX_RENDER_TIME: 100, // 100ms
    CRITICAL_WEB_VITALS: {
      LCP: 2500, // Largest Contentful Paint
      FID: 100,  // First Input Delay
      CLS: 0.1   // Cumulative Layout Shift
    }
  },
  
  // Security configuration
  SECURITY: {
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 horas
    PASSWORD_MIN_LENGTH: 8,
    REQUIRE_VERIFICATION: true,
    MAX_FILE_SIZE: 5 * 1024 * 1024 // 5MB
  }
};

export const isProduction = () => import.meta.env.MODE === 'production';

export const getEnvironmentConfig = () => ({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  gaTrackingId: import.meta.env.VITE_GA_TRACKING_ID,
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENVIRONMENT || 'development'
});
