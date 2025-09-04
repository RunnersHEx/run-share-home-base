import { useState, useCallback } from 'react';
import { 
  generateAndSendMFACode, 
  verifyMFACode, 
  clearMFACode, 
  requiresMFA,
  isMFACodeVerified 
} from '@/services/mfa/mfaService';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface UseMFAReturn {
  // State
  mfaRequired: boolean;
  mfaCodeSent: boolean;
  mfaVerified: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  checkMFARequired: (email: string) => boolean;
  sendMFACode: (email: string) => Promise<boolean>;
  verifyCode: (email: string, code: string) => Promise<boolean>;
  resetMFA: () => void;
}

export const useMFA = (): UseMFAReturn => {
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCodeSent, setMfaCodeSent] = useState(false);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkMFARequired = useCallback((email: string): boolean => {
    const required = requiresMFA(email);
    setMfaRequired(required);
    return required;
  }, []);

  const sendMFACode = useCallback(async (email: string): Promise<boolean> => {
    if (!requiresMFA(email)) {
      setError('MFA not required for this email');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await generateAndSendMFACode(email);

      if (result.success) {
        setMfaCodeSent(true);
        toast.success('Código de verificación enviado a tu email');
        
        // Show development code if email service failed
        if (result.error && result.error.includes('verification code is:')) {
          toast.info(result.error, { duration: 10000 });
        }
        
        return true;
      } else {
        setError(result.error || 'Failed to send MFA code');
        toast.error(result.error || 'Error al enviar el código de verificación');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error sending MFA code';
      setError(errorMessage);
      toast.error(errorMessage);
      logger.error('Error in sendMFACode:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyCode = useCallback(async (email: string, code: string): Promise<boolean> => {
    if (!code.trim()) {
      setError('Please enter the verification code');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = verifyMFACode(email, code);

      if (result.success) {
        setMfaVerified(true);
        toast.success('Código verificado correctamente');
        return true;
      } else {
        setError(result.error || 'Invalid verification code');
        toast.error(result.error || 'Código de verificación inválido');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error verifying code';
      setError(errorMessage);
      toast.error(errorMessage);
      logger.error('Error in verifyCode:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetMFA = useCallback(() => {
    setMfaRequired(false);
    setMfaCodeSent(false);
    setMfaVerified(false);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    mfaRequired,
    mfaCodeSent,
    mfaVerified,
    isLoading,
    error,
    checkMFARequired,
    sendMFACode,
    verifyCode,
    resetMFA,
  };
};
