// Production Security Configuration
import { env } from './envValidation';

// Security headers for production
export const getSecurityHeaders = () => {
  if (env.VITE_ENVIRONMENT === 'production') {
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };
  }
  return {};
};

// Content Security Policy for production
export const getCSPHeader = () => {
  if (env.VITE_ENVIRONMENT === 'production') {
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://js.stripe.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://tufikuyzllmrfinvmltt.supabase.co https://api.stripe.com",
        "frame-src https://js.stripe.com",
        "object-src 'none'",
        "base-uri 'self'"
      ].join('; ')
    };
  }
  return {};
};

// Production security configuration
export const PRODUCTION_SECURITY = {
  // Rate limiting thresholds (requests per minute)
  RATE_LIMITS: {
    AUTH_ATTEMPTS: 5,
    BOOKING_REQUESTS: 3,
    SEARCH_QUERIES: 30,
    MESSAGE_SENDING: 10,
    PASSWORD_RESET: 3
  },
  
  // Session security
  SESSION: {
    TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    REFRESH_THRESHOLD: 10 * 60 * 1000, // 10 minutes before expiry
    REQUIRE_VERIFICATION: true
  },
  
  // File upload security
  UPLOADS: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    SCAN_FOR_MALWARE: env.VITE_ENVIRONMENT === 'production'
  },
  
  // API security
  API: {
    ENABLE_CORS: env.VITE_ENVIRONMENT !== 'production',
    REQUIRE_HTTPS: env.VITE_ENVIRONMENT === 'production',
    REQUEST_TIMEOUT: 30000 // 30 seconds
  }
};

// Initialize security measures
export const initializeSecurity = () => {
  if (typeof window !== 'undefined') {
    const isProduction = env.VITE_ENVIRONMENT === 'production';
    const isStaging = env.VITE_ENVIRONMENT === 'staging';
    
    // Apply full security measures in production
    if (isProduction) {
      // Disable right-click context menu in production
      document.addEventListener('contextmenu', (e) => e.preventDefault());
      
      // Disable F12 developer tools in production
      document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C')) {
          e.preventDefault();
        }
      });
      
      // Clear console in production
      if (console.clear) {
        console.clear();
      }
      
      // Override console methods in production
      console.log = () => {};
      console.warn = () => {};
      console.error = () => {};
    }
    
    // Apply moderate security measures in staging
    else if (isStaging) {
      // In staging: keep console access but add warning
      console.warn('🔶 STAGING ENVIRONMENT - Debug tools available for testing');
      
      // Less restrictive than production, but still some protection
      document.addEventListener('contextmenu', (e) => {
        console.log('Right-click detected in staging environment');
      });
    }
    
    // Development: No security restrictions
    else {
      console.log('🔧 DEVELOPMENT ENVIRONMENT - All debug tools available');
    }
  }
};
