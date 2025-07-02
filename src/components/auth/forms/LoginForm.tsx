
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LoginFormProps {
  onSubmit: (data: { email: string; password: string }) => Promise<void>;
  isLoading: boolean;
  onModeChange: () => void;
}

const LoginForm = ({ onSubmit, isLoading, onModeChange }: LoginFormProps) => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'El formato del email no es válido';
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('LoginForm: Form submission started');
    
    // Prevenir múltiples envíos
    if (submitting || isLoading) {
      console.log('LoginForm: Submission blocked - already in progress');
      return;
    }
    
    // Validar formulario
    if (!validateForm()) {
      console.log('LoginForm: Form validation failed');
      return;
    }
    
    setSubmitting(true);
    setErrors({});
    
    try {
      console.log('LoginForm: Calling onSubmit with validated data');
      await onSubmit({
        email: formData.email.trim(),
        password: formData.password
      });
      console.log('LoginForm: onSubmit completed successfully');
    } catch (error: any) {
      console.error('LoginForm: Form submission error:', error);
      
      // Manejar errores específicos
      if (error.message?.includes('email')) {
        setErrors({ email: error.message });
      } else if (error.message?.includes('contraseña') || error.message?.includes('password')) {
        setErrors({ password: error.message });
      } else {
        setErrors({ password: error.message || 'Error al iniciar sesión' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (submitting || isLoading) {
      console.log('LoginForm: Google sign in blocked - already in progress');
      return;
    }
    
    setSubmitting(true);
    setErrors({});
    
    try {
      console.log('LoginForm: Starting Google OAuth sign in');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        console.error('LoginForm: Google sign in error:', error);
        setErrors({ email: 'Error al iniciar sesión con Google' });
      } else {
        console.log('LoginForm: Google OAuth initiated successfully');
      }
    } catch (error: any) {
      console.error('LoginForm: Google OAuth exception:', error);
      setErrors({ email: 'Error al conectar con Google' });
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = formData.email.trim() && formData.password;
  const isDisabled = submitting || isLoading || !isFormValid;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
              value={formData.email}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, email: e.target.value }));
                if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
              }}
              disabled={submitting || isLoading}
              required
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Tu contraseña"
              className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
              value={formData.password}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, password: e.target.value }));
                if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
              }}
              disabled={submitting || isLoading}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              disabled={submitting || isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50" 
          disabled={isDisabled}
        >
          {submitting ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">O continúa con</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        className="w-full"
        disabled={submitting || isLoading}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {submitting ? "Conectando..." : "Continuar con Google"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onModeChange}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
          disabled={submitting || isLoading}
        >
          ¿No tienes cuenta? Regístrate aquí
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
