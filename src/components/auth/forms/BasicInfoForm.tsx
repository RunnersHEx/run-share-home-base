
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
// import GoogleSignUpButton from "./GoogleSignUpButton"; // COMMENTED OUT FOR FUTURE USE
import BasicInfoFormFields from "./BasicInfoFormFields";
import ReCaptcha, { ReCaptchaRef } from "@/components/common/ReCaptcha";
import LegalModal from "@/components/legal/LegalModal";
import { toast } from "sonner";

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

  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCaptchaRef>(null);
  
  // Legal acceptance state
  const [agreeToPrivacyPolicy, setAgreeToPrivacyPolicy] = useState(false);
  const [agreeToTermsConditions, setAgreeToTermsConditions] = useState(false);
  const [legalModal, setLegalModal] = useState<{
    isOpen: boolean;
    type: "privacy-policy" | "terms-conditions" | null;
  }>({
    isOpen: false,
    type: null
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

  const openLegalModal = (type: "privacy-policy" | "terms-conditions") => {
    setLegalModal({ isOpen: true, type });
  };

  const closeLegalModal = () => {
    setLegalModal({ isOpen: false, type: null });
  };

  const handleRecaptchaVerify = (token: string | null) => {
    setRecaptchaToken(token);
    if (token) {
      toast.success('Verificación reCAPTCHA completada');
    }
  };
  
  const handleRecaptchaExpired = () => {
    setRecaptchaToken(null);
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
    
    // Validate legal acceptance requirements
    if (!agreeToPrivacyPolicy) {
      toast.error('Debes leer y aceptar la Política de Privacidad para continuar');
      return;
    }

    if (!agreeToTermsConditions) {
      toast.error('Debes aceptar los Términos y Condiciones para continuar');
      return;
    }
    
    // Validate reCAPTCHA
    if (!recaptchaToken) {
      toast.error('Por favor completa la verificación reCAPTCHA');
      return;
    }
    
    // Include recaptcha token and legal acceptance in the form data
    onSubmit({ 
      ...formData, 
      recaptchaToken, 
      agreeToPrivacyPolicy, 
      agreeToTermsConditions 
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Información Personal</h3>
        <p className="text-sm text-gray-600">Completa tus datos básicos</p>
      </div>

      {/* GOOGLE SIGN UP BUTTON - COMMENTED OUT FOR FUTURE USE
      <GoogleSignUpButton isLoading={isLoading} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">O completa el formulario</span>
        </div>
      </div>
      END GOOGLE SIGN UP BUTTON COMMENT */}

      <form onSubmit={handleSubmit} className="space-y-4">
        <BasicInfoFormFields 
          formData={formData} 
          onFieldChange={handleChange} 
        />

        <Separator />

        {/* Legal Acceptance Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Aceptación Legal</h4>
          
          {/* Privacy Policy Acceptance */}
          <div className="flex items-start space-x-2 p-3 border border-gray-200 rounded-lg">
            <Checkbox 
              id="privacy-policy-registration"
              checked={agreeToPrivacyPolicy}
              onCheckedChange={(checked) => setAgreeToPrivacyPolicy(checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="privacy-policy-registration" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                <strong>He leído y acepto la Política de Privacidad</strong>
                <br />
                <Button 
                  type="button"
                  variant="link" 
                  className="p-0 h-auto text-runner-blue-600 text-sm underline mt-1"
                  onClick={() => openLegalModal("privacy-policy")}
                >
                  Leer Política de Privacidad
                </Button>
              </Label>
            </div>
          </div>

          {/* Terms and Conditions Acceptance */}
          <div className="flex items-start space-x-2 p-3 border border-gray-200 rounded-lg">
            <Checkbox 
              id="terms-conditions-registration"
              checked={agreeToTermsConditions}
              onCheckedChange={(checked) => setAgreeToTermsConditions(checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="terms-conditions-registration" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                <strong>Acepto los Términos y Condiciones</strong>
                <br />
                <Button 
                  type="button"
                  variant="link" 
                  className="p-0 h-auto text-runner-blue-600 text-sm underline mt-1"
                  onClick={() => openLegalModal("terms-conditions")}
                >
                  Leer Términos y Condiciones
                </Button>
              </Label>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Al registrarte, confirmas que tienes al menos 18 años y que aceptas las condiciones legales de uso de la plataforma.
          </p>
        </div>

        {/* reCAPTCHA verification */}
        <div className="flex justify-center py-2">
          <ReCaptcha
            ref={recaptchaRef}
            onVerify={handleRecaptchaVerify}
            onExpired={handleRecaptchaExpired}
            theme="light"
            size="normal"
          />
        </div>

        <Button 
          type="submit" 
          className={`w-full transition-all ${
            agreeToPrivacyPolicy && agreeToTermsConditions && recaptchaToken
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={isLoading || !recaptchaToken || !agreeToPrivacyPolicy || !agreeToTermsConditions}
        >
          {isLoading ? "Procesando..." : "Continuar"}
        </Button>
      </form>
      
      {/* Legal Modal for Privacy Policy and Terms & Conditions */}
      {legalModal.type && (
        <LegalModal 
          isOpen={legalModal.isOpen}
          onClose={closeLegalModal}
          type={legalModal.type}
        />
      )}
    </div>
  );
};

export default BasicInfoForm;
