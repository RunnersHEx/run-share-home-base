
import { useState } from "react";
import { Button } from "@/components/ui/button";
import GoogleSignUpButton from "./GoogleSignUpButton";
import BasicInfoFormFields from "./BasicInfoFormFields";

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

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Información Personal</h3>
        <p className="text-sm text-gray-600">Completa tus datos básicos</p>
      </div>

      <GoogleSignUpButton isLoading={isLoading} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">O completa el formulario</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <BasicInfoFormFields 
          formData={formData} 
          onFieldChange={handleChange} 
        />

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
