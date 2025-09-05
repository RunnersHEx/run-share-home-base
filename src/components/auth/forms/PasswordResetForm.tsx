import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ReCaptcha, { ReCaptchaRef } from "@/components/common/ReCaptcha";
import { toast } from "sonner";

interface PasswordResetFormProps {
  onBack: () => void;
  onClose?: () => void;
}

const PasswordResetForm = ({ onBack, onClose }: PasswordResetFormProps) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaKey, setRecaptchaKey] = useState(0); // Force re-render of reCAPTCHA
  const [errors, setErrors] = useState<{ email?: string }>({});
  const recaptchaRef = useRef<ReCaptchaRef>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    // Clear previous errors
    setErrors({});
    
    // Validation
    if (!email.trim()) {
      setErrors({ email: 'El email es requerido' });
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrors({ email: 'Por favor ingresa un email válido' });
      return;
    }
    
    // Validate reCAPTCHA
    if (!recaptchaToken) {
      toast.error('Por favor completa la verificación reCAPTCHA');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await resetPassword(email.trim(), recaptchaToken);
      setEmailSent(true);
      toast.success('Se ha enviado un enlace de recuperación a tu email');
    } catch (error: any) {
      console.error('Password reset error:', error);
      const errorMessage = error.message || 'Error al enviar el email de recuperación';
      setErrors({ email: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecaptchaVerify = (token: string | null) => {
    console.log('PasswordResetForm: reCAPTCHA verification result:', !!token);
    setRecaptchaToken(token);
    if (token) {
      toast.success('Verificación reCAPTCHA completada');
    } else {
      toast.error('Verificación reCAPTCHA falló');
    }
  };
  
  const handleRecaptchaExpired = () => {
    console.log('PasswordResetForm: reCAPTCHA expired');
    setRecaptchaToken(null);
    setRecaptchaKey(prev => prev + 1);
  };
  
  const handleRecaptchaError = () => {
    console.error('PasswordResetForm: reCAPTCHA error occurred');
    setRecaptchaToken(null);
    setRecaptchaKey(prev => prev + 1);
    toast.error('Error en reCAPTCHA. Por favor, inténtalo de nuevo.');
  };

  if (emailSent) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-green-600" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Email Enviado
          </h3>
          <p className="text-sm text-gray-600">
            Hemos enviado un enlace de recuperación de contraseña a <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500">
            Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
          </p>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al login
          </Button>
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cerrar
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">
          Recuperar Contraseña
        </h3>
        <p className="text-sm text-gray-600">
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="reset-email"
              type="email"
              placeholder="tu@email.com"
              className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
              }}
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* reCAPTCHA verification */}
        <div className="flex justify-center py-2">
          <ReCaptcha
            key={recaptchaKey} // Force re-render when needed
            ref={recaptchaRef}
            onVerify={handleRecaptchaVerify}
            onExpired={handleRecaptchaExpired}
            onError={handleRecaptchaError}
            theme="light"
            size="normal"
            className="recaptcha-modal-widget"
          />
        </div>

        <div className="flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            disabled={isLoading}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Atrás
          </Button>
          <Button 
            type="submit" 
            className="flex-1 bg-blue-600 hover:bg-blue-700" 
            disabled={isLoading || !recaptchaToken}
          >
            {isLoading ? "Enviando..." : "Enviar Email"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PasswordResetForm;