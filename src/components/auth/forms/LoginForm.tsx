
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitting || isLoading) {
      console.log('LoginForm: Submission blocked - already submitting or loading');
      return;
    }
    
    console.log('LoginForm: Starting form submission');
    console.log('LoginForm: Email:', formData.email);
    console.log('LoginForm: Password length:', formData.password?.length || 0);
    
    if (!formData.email?.trim() || !formData.password) {
      console.error('LoginForm: Missing email or password');
      return;
    }

    setSubmitting(true);
    
    try {
      console.log('LoginForm: Calling onSubmit with data');
      await onSubmit({
        email: formData.email.trim(),
        password: formData.password
      });
      console.log('LoginForm: onSubmit completed successfully');
    } catch (error) {
      console.error('LoginForm: Error during form submission:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (submitting || isLoading) {
      console.log('LoginForm: Google sign in blocked - already submitting or loading');
      return;
    }
    
    setSubmitting(true);
    try {
      console.log('LoginForm: Starting Google sign in');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        console.error('LoginForm: Google sign in error:', error);
      } else {
        console.log('LoginForm: Google sign in initiated');
      }
    } catch (error) {
      console.error('LoginForm: Google sign in exception:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormDisabled = isLoading || submitting || !formData.email?.trim() || !formData.password;

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
              className="pl-10"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled={submitting || isLoading}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Tu contraseña"
              className="pl-10 pr-10"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              disabled={submitting || isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              disabled={submitting || isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700" 
          disabled={isFormDisabled}
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
        Continuar con Google
      </Button>
    </div>
  );
};

export default LoginForm;
