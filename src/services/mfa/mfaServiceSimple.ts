import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const ADMIN_EMAIL = 'syedhamza2381@gmail.com';
const MFA_CODE_EXPIRY_MINUTES = 10;

export interface MFACode {
  code: string;
  email: string;
  expiresAt: Date;
  verified: boolean;
}

// In-memory storage for MFA codes
const mfaCodes = new Map<string, MFACode>();

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if email requires MFA
 */
export function requiresMFA(email: string): boolean {
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Generate and send MFA code to admin email
 */
export async function generateAndSendMFACode(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!requiresMFA(email)) {
      return { success: false, error: 'MFA not required for this email' };
    }

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + MFA_CODE_EXPIRY_MINUTES * 60 * 1000);

    // Store the code
    mfaCodes.set(email.toLowerCase(), {
      code,
      email: email.toLowerCase(),
      expiresAt,
      verified: false
    });

    logger.info('MFA code generated for admin email:', { email, code, expiresAt });

    // Try to send email using Web3Forms (free and simple)
    const emailSent = await sendMFACodeViaWeb3Forms(email, code);
    
    if (emailSent) {
      logger.info('MFA email sent successfully to:', email);
      return { success: true };
    } else {
      // Fallback to console display
      console.log('🔐 MFA Code for', email, ':', code);
      console.log('⏰ Expires at:', expiresAt);
      
      return { 
        success: true, 
        error: `Email service temporarily unavailable. Your code is: ${code}` 
      };
    }

  } catch (error: any) {
    logger.error('Error generating MFA code:', error);
    return { success: false, error: error.message || 'Failed to generate MFA code' };
  }
}

/**
 * Send MFA code via Web3Forms (free email service)
 */
async function sendMFACodeViaWeb3Forms(email: string, code: string): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append('access_key', 'YOUR_WEB3FORMS_KEY_HERE'); // We'll set this up
    formData.append('subject', 'Runners Home Exchange - Security Verification Code');
    formData.append('email', email);
    formData.append('message', `
Your verification code for admin access is: ${code}

This code expires in ${MFA_CODE_EXPIRY_MINUTES} minutes.

If you didn't request this code, please ignore this message.

- Runners Home Exchange Security Team
    `);

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      logger.info('MFA email sent successfully via Web3Forms');
      return true;
    } else {
      logger.error('Web3Forms failed:', response.status);
      return false;
    }

  } catch (error) {
    logger.error('Failed to send email via Web3Forms:', error);
    return false;
  }
}

/**
 * Verify MFA code
 */
export function verifyMFACode(email: string, inputCode: string): { success: boolean; error?: string } {
  const normalizedEmail = email.toLowerCase();
  const storedCode = mfaCodes.get(normalizedEmail);

  if (!storedCode) {
    return { success: false, error: 'No MFA code found. Please request a new code.' };
  }

  if (storedCode.verified) {
    return { success: false, error: 'Code already used. Please request a new code.' };
  }

  if (new Date() > storedCode.expiresAt) {
    mfaCodes.delete(normalizedEmail);
    return { success: false, error: 'Code expired. Please request a new code.' };
  }

  if (storedCode.code !== inputCode.trim()) {
    return { success: false, error: 'Invalid code. Please try again.' };
  }

  // Mark code as verified
  storedCode.verified = true;
  mfaCodes.set(normalizedEmail, storedCode);

  logger.info('MFA code verified successfully for:', email);
  return { success: true };
}

/**
 * Clear MFA code after successful verification
 */
export function clearMFACode(email: string): void {
  mfaCodes.delete(email.toLowerCase());
}

/**
 * Check if MFA code is verified
 */
export function isMFACodeVerified(email: string): boolean {
  const normalizedEmail = email.toLowerCase();
  const storedCode = mfaCodes.get(normalizedEmail);
  return storedCode?.verified === true;
}

/**
 * Clean up expired codes periodically
 */
export function cleanupExpiredCodes(): void {
  const now = new Date();
  for (const [email, code] of mfaCodes.entries()) {
    if (now > code.expiresAt) {
      mfaCodes.delete(email);
      logger.debug('Cleaned up expired MFA code for:', email);
    }
  }
}

// Clean up expired codes every 5 minutes
setInterval(cleanupExpiredCodes, 5 * 60 * 1000);
