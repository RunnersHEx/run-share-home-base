
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock, Phone, Calendar, Eye, EyeOff } from "lucide-react";
import PasswordValidationIndicator from "./PasswordValidationIndicator";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  birthDate: string;
}

interface BasicInfoFormFieldsProps {
  formData: FormData;
  onFieldChange: (field: string, value: string) => void;
}

const BasicInfoFormFields = ({ formData, onFieldChange }: BasicInfoFormFieldsProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-4">
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
              onChange={(e) => onFieldChange("firstName", e.target.value)}
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
              onChange={(e) => onFieldChange("lastName", e.target.value)}
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
            onChange={(e) => onFieldChange("email", e.target.value)}
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
            onChange={(e) => onFieldChange("password", e.target.value)}
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
        
        <PasswordValidationIndicator password={formData.password} />
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
            onChange={(e) => onFieldChange("confirmPassword", e.target.value)}
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
              onChange={(e) => onFieldChange("phone", e.target.value)}
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
              onChange={(e) => onFieldChange("birthDate", e.target.value)}
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoFormFields;
