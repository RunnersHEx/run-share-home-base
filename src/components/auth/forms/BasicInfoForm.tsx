
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff, Check, X } from "lucide-react";

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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validaciones de contraseña en tiempo real
  const passwordValidations = {
    minLength: formData.password.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  };

  const isPasswordValid = Object.values(passwordValidations).every(Boolean);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== "";

  const isFormValid = formData.firstName && 
                     formData.lastName && 
                     formData.email && 
                     formData.phone && 
                     formData.birthDate && 
                     isPasswordValid && 
                     passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      return;
    }
    onSubmit(formData);
  };

  const ValidationIcon = ({ isValid }: { isValid: boolean }) => (
    isValid ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Información Personal</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nombre *</Label>
          <Input
            id="firstName"
            placeholder="Tu nombre"
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Apellidos *</Label>
          <Input
            id="lastName"
            placeholder="Tus apellidos"
            value={formData.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña *</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Tu contraseña"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Validaciones de contraseña en tiempo real */}
        <div className="space-y-1 text-sm">
          <div className="flex items-center space-x-2">
            <ValidationIcon isValid={passwordValidations.minLength} />
            <span className={passwordValidations.minLength ? "text-green-600" : "text-red-600"}>
              Mínimo 8 caracteres
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <ValidationIcon isValid={passwordValidations.hasUppercase} />
            <span className={passwordValidations.hasUppercase ? "text-green-600" : "text-red-600"}>
              Al menos una letra mayúscula
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <ValidationIcon isValid={passwordValidations.hasNumber} />
            <span className={passwordValidations.hasNumber ? "text-green-600" : "text-red-600"}>
              Al menos un número
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <ValidationIcon isValid={passwordValidations.hasSpecial} />
            <span className={passwordValidations.hasSpecial ? "text-green-600" : "text-red-600"}>
              Al menos un carácter especial
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirma tu contraseña"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {formData.confirmPassword && (
          <div className="flex items-center space-x-2 text-sm">
            <ValidationIcon isValid={passwordsMatch} />
            <span className={passwordsMatch ? "text-green-600" : "text-red-600"}>
              Las contraseñas coinciden
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+34 123 456 789"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
          <Input
            id="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={(e) => handleInputChange("birthDate", e.target.value)}
            required
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-700" 
        disabled={isLoading || !isFormValid}
      >
        {isLoading ? "Guardando..." : "Continuar"}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </form>
  );
};

export default BasicInfoForm;
