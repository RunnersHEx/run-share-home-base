import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import emailjs from '@emailjs/browser';

const ADMIN_EMAIL = 'runnershomeexchange@gmail.com';
const MFA_CODE_EXPIRY_MINUTES = 10;

// EmailJS configuration from environment variables
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export interface MFACode {
  code: string;
  email: string;
  expiresAt: Date;
  verified: boolean;
}

// In-memory storage for MFA codes
const mfaCodes = new Map<string, MFACode>();

// Initialize EmailJS
if (EMAILJS_PUBLIC_KEY) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
  logger.info('EmailJS initialized successfully');
} else {
  logger.warn('EmailJS not configured - emails will be shown in console only');
}

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

    logger.info('MFA code generated for admin email:', { email, expiresAt });

    // Send email using EmailJS
    const emailSent = await sendMFACodeEmail(email, code);
    
    if (emailSent) {
      logger.info('MFA email sent successfully to:', email);
      return { success: true };
    } else {
      // Fallback to console display for development
      if (import.meta.env.DEV) {
        console.log('🔐 MFA Code for', email, ':', code);
        console.log('⏰ Expires at:', expiresAt);
      }
      
      return { 
        success: true, 
        error: `Email service temporarily unavailable. Your verification code is: ${code}` 
      };
    }

  } catch (error: any) {
    logger.error('Error generating MFA code:', error);
    return { success: false, error: error.message || 'Failed to generate MFA code' };
  }
}

/**
 * Send MFA code via EmailJS
 */
async function sendMFACodeEmail(email: string, code: string): Promise<boolean> {
  try {
    // Validate EmailJS configuration
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      logger.warn('EmailJS not configured properly');
      return false;
    }

    // Template parameters that match EmailJS template
    const templateParams = {
      to_email: email,
      verification_code: code,
      app_name: 'Runners Home Exchange',
      expiry_minutes: MFA_CODE_EXPIRY_MINUTES,
      from_name: 'Runners Home Exchange',
      user_name: email.split('@')[0]
    };

    // Send email
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    if (result.status === 200) {
      logger.info('MFA email sent successfully via EmailJS');
      return true;
    } else {
      logger.error('EmailJS failed with status:', result.status);
      return false;
    }

  } catch (error: any) {
    logger.error('Failed to send MFA email via EmailJS:', error);
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
