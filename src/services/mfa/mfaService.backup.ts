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

// In-memory storage for MFA codes (for demo purposes - in production, use database)
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

    // Try to send email using a custom implementation
    const emailSent = await sendMFACodeEmail(email, code);
    
    if (emailSent) {
      logger.info('MFA email sent successfully to:', email);
      return { success: true };
    } else {
      // For development/testing, we'll allow the process to continue
      // and show the code to the user
      console.log('🔐 MFA Code for', email, ':', code);
      console.log('⏰ Expires at:', expiresAt);
      
      return { 
        success: true, 
        error: `Development mode: Your verification code is ${code}` 
      };
    }

  } catch (error: any) {
    logger.error('Error generating MFA code:', error);
    return { success: false, error: error.message || 'Failed to generate MFA code' };
  }
}

/**
 * Send MFA code via email
 */
async function sendMFACodeEmail(email: string, code: string): Promise<boolean> {
  try {
    // Try using the mailto protocol to open the user's email client
    // This is a simple, free approach for development
    const subject = encodeURIComponent('Runners Home Exchange - Código de Verificación');
    const body = encodeURIComponent(
      `Hola,\n\n` +
      `Tu código de verificación para acceder como administrador es:\n\n` +
      `${code}\n\n` +
      `Este código expira en 10 minutos.\n\n` +
      `Si no solicitaste este código, ignora este mensaje.\n\n` +
      `Saludos,\nEquipo de Runners Home Exchange`
    );
    
    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
    
    // In development, we'll just log the email instead of opening mailto
    if (import.meta.env.DEV) {
      console.log('📧 MFA Email Content:');
      console.log('To:', email);
      console.log('Subject: Runners Home Exchange - Código de Verificación');
      console.log('Body:');
      console.log(decodeURIComponent(body));
      console.log('\nMailto URL:', mailtoUrl);
      
      // Return false to show the code in the UI for development
      return false;
    }
    
    // In production, try to trigger the email client
    // Note: This is limited and may not work in all browsers/environments
    try {
      window.open(mailtoUrl, '_self');
      return true;
    } catch (error) {
      logger.warn('Mailto failed, falling back to console log:', error);
      return false;
    }
    
  } catch (error) {
    logger.error('Failed to send MFA email:', error);
    return false;
  }
}

/**
 * Send MFA code via a custom email method (fallback)
 */
async function sendMFACodeCustom(email: string, code: string): Promise<boolean> {
  try {
    // For demo purposes, we'll just log the code
    // In a real implementation, you would use a service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Nodemailer with SMTP
    
    console.log('📧 Sending MFA code to:', email);
    console.log('🔐 MFA Code:', code);
    console.log('This would normally be sent via email service');

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return true;
  } catch (error) {
    logger.error('Failed to send custom MFA email:', error);
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
