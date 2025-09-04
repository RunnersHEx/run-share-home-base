import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail, Shield, RefreshCw } from 'lucide-react';
import { useMFA } from '@/hooks/useMFA';

interface MFAVerificationProps {
  email: string;
  onVerified: () => void;
  onCancel: () => void;
  hideHeader?: boolean; // For integration with modal
}

const MFAVerification = ({ email, onVerified, onCancel, hideHeader = false }: MFAVerificationProps) => {
  const [code, setCode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  
  const {
    mfaCodeSent,
    isLoading,
    error,
    sendMFACode,
    verifyCode,
    resetMFA
  } = useMFA();

  // Countdown timer
  useEffect(() => {
    if (!mfaCodeSent) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mfaCodeSent]);

  // Send MFA code on component mount
  useEffect(() => {
    if (!mfaCodeSent) {
      sendMFACode(email);
    }
  }, [email, mfaCodeSent, sendMFACode]);

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      return;
    }

    const success = await verifyCode(email, code);
    if (success) {
      onVerified();
    }
  };

  const handleResendCode = async () => {
    setCode('');
    setTimeRemaining(600);
    await sendMFACode(email);
  };

  const handleCancel = () => {
    resetMFA();
    onCancel();
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const isExpired = timeRemaining <= 0;
  const canResend = !isLoading && (isExpired || timeRemaining < 540); // Allow resend after 1 minute

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Header */}
      {!hideHeader && (
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Verificación de Seguridad
          </h2>
          <p className="text-sm text-gray-600">
            Para mayor seguridad, hemos enviado un código de verificación a tu email
          </p>
        </div>
      )}

      {/* Email Display */}
      <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
        <Mail className="w-5 h-5 text-gray-400" />
        <div>
          <p className="text-sm font-medium text-gray-900">{email}</p>
          <p className="text-xs text-gray-500">Revisa tu bandeja de entrada y spam</p>
        </div>
      </div>

      {/* Code Input */}
      <div className="space-y-3">
        <Label htmlFor="mfa-code" className="text-sm font-medium text-gray-700">
          Código de Verificación
        </Label>
        <div className="flex justify-center">
          <InputOTP
            value={code}
            onChange={setCode}
            maxLength={6}
            disabled={isLoading || isExpired}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        
        {/* Timer */}
        <div className="text-center">
          {isExpired ? (
            <p className="text-sm text-red-600">
              El código ha expirado. Solicita uno nuevo.
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              El código expira en {formatTime(timeRemaining)}
            </p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleVerifyCode}
          disabled={isLoading || code.length !== 6 || isExpired}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Verificando...' : 'Verificar Código'}
        </Button>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleResendCode}
            disabled={!canResend}
            className="flex-1"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Enviando...' : 'Reenviar Código'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
      </div>

      {/* Help Text */}
      <div className="text-center space-y-2">
        <p className="text-xs text-gray-500">
          ¿No recibiste el código? Verifica tu carpeta de spam o solicita uno nuevo.
        </p>
      </div>
    </div>
  );
};

export default MFAVerification;
