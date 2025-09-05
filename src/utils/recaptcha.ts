/**
 * reCAPTCHA verification utilities
 * This provides client-side reCAPTCHA validation and can be extended for server-side verification
 */

export interface RecaptchaVerificationResult {
  success: boolean;
  error?: string;
}

/**
 * Check if we're running on localhost for development
 */
const isLocalhost = () => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' || 
         window.location.hostname === '0.0.0.0' ||
         window.location.hostname.startsWith('192.168.') ||
         window.location.hostname.endsWith('.local');
};

/**
 * Check if we're in development mode
 */
const isDevelopment = () => {
  // If VITE_FORCE_RECAPTCHA is true, never bypass reCAPTCHA (for testing)
  if (import.meta.env.VITE_FORCE_RECAPTCHA === 'true') {
    console.log('🔧 VITE_FORCE_RECAPTCHA=true - reCAPTCHA verification required on localhost');
    return false;
  }
  
  return import.meta.env.VITE_ENVIRONMENT === 'development' || 
         import.meta.env.DEV || 
         isLocalhost();
};

/**
 * Verify reCAPTCHA token on client-side (basic validation)
 * For production, consider implementing server-side verification for better security
 * 
 * @param token - reCAPTCHA token from the widget
 * @returns Promise with verification result
 */
export const verifyRecaptchaToken = async (token: string | null): Promise<RecaptchaVerificationResult> => {
  // Bypass reCAPTCHA verification for localhost/development
  if (isDevelopment()) {
    console.log('🔓 reCAPTCHA bypassed for localhost/development environment');
    return {
      success: true
    };
  }
  
  // Basic client-side validation for production
  if (!token) {
    return {
      success: false,
      error: 'reCAPTCHA token is required'
    };
  }

  if (typeof token !== 'string' || token.length < 10) {
    return {
      success: false,
      error: 'Invalid reCAPTCHA token format'
    };
  }

  // For now, we trust the client-side token
  // In production, you would send this token to your backend for verification
  return {
    success: true
  };
};

/**
 * Server-side reCAPTCHA verification function (for future implementation)
 * This would be called from a Supabase Edge Function or your backend API
 * 
 * @param token - reCAPTCHA token from the widget
 * @param remoteip - User's IP address (optional)
 * @returns Promise with verification result
 */
export const verifyRecaptchaServerSide = async (
  token: string, 
  remoteip?: string
): Promise<RecaptchaVerificationResult> => {
  const secretKey = import.meta.env.VITE_RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    return {
      success: false,
      error: 'reCAPTCHA secret key not configured'
    };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        ...(remoteip && { remoteip })
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: `reCAPTCHA verification failed: ${result['error-codes']?.join(', ') || 'Unknown error'}`
      };
    }
  } catch (error) {
    console.error('reCAPTCHA server verification error:', error);
    return {
      success: false,
      error: 'reCAPTCHA verification service unavailable'
    };
  }
};

/**
 * Validate reCAPTCHA requirements for different actions
 */
export const getRecaptchaRequirements = () => {
  return {
    login: {
      required: true,
      message: 'reCAPTCHA verification is required for login'
    },
    register: {
      required: true,
      message: 'reCAPTCHA verification is required for registration'
    },
    passwordReset: {
      required: true,
      message: 'reCAPTCHA verification is required for password reset'
    }
  };
};

export default {
  verifyRecaptchaToken,
  verifyRecaptchaServerSide,
  getRecaptchaRequirements
};