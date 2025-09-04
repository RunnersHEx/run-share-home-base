import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { toast } from 'sonner';

// Development bypass helper
const isLocalhost = () => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' || 
         window.location.hostname === '0.0.0.0' ||
         window.location.hostname.startsWith('192.168.') ||
         window.location.hostname.endsWith('.local');
};

const isDevelopment = () => {
  // If VITE_FORCE_RECAPTCHA is true, never bypass reCAPTCHA (for testing)
  if (import.meta.env.VITE_FORCE_RECAPTCHA === 'true') {
    console.log('🔧 VITE_FORCE_RECAPTCHA=true - reCAPTCHA will work on localhost');
    return false;
  }
  
  return import.meta.env.VITE_ENVIRONMENT === 'development' || 
         import.meta.env.DEV || 
         isLocalhost();
};

export interface ReCaptchaRef {
  executeRecaptcha: () => Promise<string | null>;
  resetRecaptcha: () => void;
}

interface ReCaptchaProps {
  onVerify?: (token: string | null) => void;
  onExpired?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark';
  size?: 'compact' | 'normal' | 'invisible';
  className?: string;
}

const ReCaptcha = forwardRef<ReCaptchaRef, ReCaptchaProps>(({
  onVerify,
  onExpired,
  onError,
  theme = 'light',
  size = 'normal',
  className = ''
}, ref) => {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const isDevMode = isDevelopment();
  
  // Track when reCAPTCHA script is loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).grecaptcha) {
      setIsLoaded(true);
    } else {
      // Wait for script to load
      const checkLoaded = () => {
        if ((window as any).grecaptcha) {
          setIsLoaded(true);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    }
  }, []);

  // Auto-verify for localhost/development
  useEffect(() => {
    if (isDevMode && onVerify) {
      console.log('🔓 reCAPTCHA bypassed for localhost/development environment');
      // Simulate reCAPTCHA verification with a fake token
      setTimeout(() => {
        onVerify('dev-bypass-token');
      }, 100);
    }
  }, [isDevMode, onVerify]);

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    executeRecaptcha: async (): Promise<string | null> => {
      // Return fake token for development
      if (isDevMode) {
        return 'dev-bypass-token';
      }
      
      if (!recaptchaRef.current) {
        toast.error('reCAPTCHA not initialized');
        return null;
      }

      try {
        setIsVerifying(true);
        const token = await recaptchaRef.current.executeAsync();
        if (!token) {
          toast.error('reCAPTCHA verification failed');
          return null;
        }
        return token;
      } catch (error) {
        console.error('reCAPTCHA execution error:', error);
        toast.error('reCAPTCHA error occurred');
        return null;
      } finally {
        setIsVerifying(false);
      }
    },
    resetRecaptcha: () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setIsExpired(false);
      }
    }
  }));

  const handleVerify = (token: string | null) => {
    setIsVerifying(false);
    setIsExpired(false);
    
    if (token) {
      console.log('✅ reCAPTCHA verified successfully');
    } else {
      console.log('❌ reCAPTCHA verification failed');
    }
    
    if (onVerify) {
      onVerify(token);
    }
  };

  const handleExpired = () => {
    console.log('⏰ reCAPTCHA expired');
    setIsExpired(true);
    toast.warning('reCAPTCHA expired. Please verify again.');
    if (onExpired) {
      onExpired();
    }
  };

  const handleError = () => {
    console.error('❌ reCAPTCHA error occurred');
    setIsVerifying(false);
    toast.error('reCAPTCHA error occurred. Please try again.');
    if (onError) {
      onError();
    }
  };

  // Handle reCAPTCHA load event
  const handleLoad = () => {
    console.log('📝 reCAPTCHA loaded');
    setIsLoaded(true);
  };

  if (!siteKey && !isDevMode) {
    console.error('reCAPTCHA site key is not configured');
    return (
      <div className="text-red-500 text-sm p-2 border border-red-200 rounded">
        reCAPTCHA configuration error
      </div>
    );
  }

  // Show development bypass message for localhost
  if (isDevMode) {
    return (
      <div className={`recaptcha-container ${className}`}>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-center">
          <div className="text-yellow-800 text-sm font-medium">
            🔓 Development Mode: reCAPTCHA Bypassed
          </div>
          <div className="text-yellow-600 text-xs mt-1">
            (localhost detected - reCAPTCHA auto-verified)
          </div>
          <div className="text-yellow-500 text-xs mt-1">
            Set VITE_FORCE_RECAPTCHA=true to test reCAPTCHA locally
          </div>
        </div>
      </div>
    );
  }
  
  // Show testing mode message when force-enabled on localhost
  if (isLocalhost() && import.meta.env.VITE_FORCE_RECAPTCHA === 'true') {
    console.log('📝 reCAPTCHA Testing Mode Active on localhost');
  }

  return (
    <div className={`recaptcha-container relative ${className}`} style={{ zIndex: 2147483647 }}>
      {/* Loading indicator */}
      {!isLoaded && (
        <div className="flex items-center justify-center p-4 text-gray-500 text-sm">
          Loading reCAPTCHA...
        </div>
      )}
      
      {/* Expired indicator */}
      {isExpired && (
        <div className="bg-red-50 border border-red-200 rounded p-2 text-center mb-2">
          <div className="text-red-800 text-sm">
            ⚠️ reCAPTCHA expired - Please verify again
          </div>
        </div>
      )}
      
      {/* Verifying indicator */}
      {isVerifying && (
        <div className="bg-blue-50 border border-blue-200 rounded p-2 text-center mb-2">
          <div className="text-blue-800 text-sm">
            🔄 Verifying...
          </div>
        </div>
      )}

      <div 
        className="recaptcha-widget-container"
        style={{
          position: 'relative',
          zIndex: 2147483647,
          pointerEvents: 'auto'
        }}
      >
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={siteKey}
          onChange={handleVerify}
          onExpired={handleExpired}
          onError={handleError}
          onLoad={handleLoad}
          theme={theme}
          size={size}
          style={{
            position: 'relative',
            zIndex: 2147483647
          }}
        />
      </div>
    </div>
  );
});

ReCaptcha.displayName = 'ReCaptcha';

export default ReCaptcha;