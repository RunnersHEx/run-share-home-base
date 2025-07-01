
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock, Phone, Calendar, Eye, EyeOff, Check, X } from "lucide-react";

interface BasicInfoFormProps {
  onSubmit: (data: any) => void;
  initialData: any;
  isLoading: boolean;
}

const BasicInfoForm = ({ onSubmit, initialData, isLoading }: BasicInfoFormProps) => {
  const [formData, setFormData] = useState({
    firstName: initialData.firstName || "",
    lastName: initialData.lastName || "",
    email: initialData.email || "",
    password: initialData.password || "",
    confirmPassword: initialData.confirmPassword || "",
    phone: initialData.phone || "",
    birthDate: initialData.birthDate || ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validaciones de contraseña
  const passwordValidations = {
    minLength: formData.password.length >= 8,
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    hasUppercase: /[A-Z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password)
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    
    // Validar todos los requisitos de contraseña
    if (!passwordValidations.minLength || !passwordValidations.hasSpecialChar || 
        !passwordValidations.hasUppercase || !passwordValidations.hasNumber) {
      alert("La contraseña debe cumplir todos los requisitos de seguridad");
      return;
    }
    
    onSubmit(formData);
  };

  const handleGoogleSignUp = async () => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        console.error('Error with Google sign up:', error);
      }
    } catch (error) {
      console.error('Error importing supabase:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Información Personal</h3>
        <p className="text-sm text-gray-600">Completa tus datos básicos</p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignUp}
        className="w-full mb-4"
        disabled={isLoading}
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
        Registrarse con Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">O completa el formulario</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nombre *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="firstName"
                placeholder="Tu nombre"
                className="pl-10"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Apellidos *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="lastName"
                placeholder="Tus apellidos"
                className="pl-10"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              className="pl-10"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              className="pl-10 pr-10"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          
          {/* Requisitos de contraseña */}
          <div className="mt-2 space-y-1">
            <div className={`flex items-center text-sm ${passwordValidations.minLength ? 'text-green-600' : 'text-red-600'}`}>
              {passwordValidations.minLength ? (
                <Check className="h-3 w-3 mr-2" />
              ) : (
                <X className="h-3 w-3 mr-2" />
              )}
              Mínimo 8 caracteres
            </div>
            <div className={`flex items-center text-sm ${passwordValidations.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
              {passwordValidations.hasSpecialChar ? (
                <Check className="h-3 w-3 mr-2" />
              ) : (
                <X className="h-3 w-3 mr-2" />
              )}
              1 carácter especial (!@#$%^&*)
            </div>
            <div className={`flex items-center text-sm ${passwordValidations.hasUppercase ? 'text-green-600' : 'text-red-600'}`}>
              {passwordValidations.hasUppercase ? (
                <Check className="h-3 w-3 mr-2" />
              ) : (
                <X className="h-3 w-3 mr-2" />
              )}
              Una mayúscula
            </div>
            <div className={`flex items-center text-sm ${passwordValidations.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
              {passwordValidations.hasNumber ? (
                <Check className="h-3 w-3 mr-2" />
              ) : (
                <X className="h-3 w-3 mr-2" />
              )}
              Un número
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repite tu contraseña"
              className="pl-10 pr-10"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                placeholder="+34 123 456 789"
                className="pl-10"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="birthDate"
                type="date"
                className="pl-10"
                value={formData.birthDate}
                onChange={(e) => handleChange("birthDate", e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? "Procesando..." : "Continuar"}
        </Button>
      </form>
    </div>
  );
};

export default BasicInfoForm;
