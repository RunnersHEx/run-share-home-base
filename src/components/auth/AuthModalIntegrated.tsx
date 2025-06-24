import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Mail, AlertTriangle } from "lucide-react";
import LoginForm from "./forms/LoginForm";
import BasicInfoForm from "./forms/BasicInfoForm";
import RunnerProfileForm from "./forms/RunnerProfileForm";
import EmergencyContactForm from "./forms/EmergencyContactForm";
import RoleSelectionForm from "./forms/RoleSelectionForm";
import VerificationRequiredModal from "./VerificationRequiredModal";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AuthModalIntegratedProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "login" | "register";
  onModeChange: (mode: "login" | "register") => void;
}

const AuthModalIntegrated = ({ isOpen, onClose, mode, onModeChange }: AuthModalIntegratedProps) => {
  const { signUp, signIn } = useAuth();
  const [registrationStep, setRegistrationStep] = useState(1);
  const [registrationData, setRegistrationData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  const handleLogin = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      toast.success("¡Bienvenido de vuelta!");
      onClose();
      
      // Mostrar modal de verificación después del login exitoso
      setTimeout(() => {
        setShowVerificationModal(true);
      }, 500);
    } catch (error: any) {
      console.error("Error during login:", error);
      if (error.message?.includes("Invalid login credentials")) {
        toast.error("Credenciales incorrectas. Verifica tu email y contraseña.");
      } else if (error.message?.includes("Email not confirmed")) {
        toast.error("Por favor, confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada y correos no deseados.");
      } else {
        toast.error("Error al iniciar sesión. Inténtalo de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationStepSubmit = (stepData: any) => {
    const updatedData = { ...registrationData, ...stepData };
    setRegistrationData(updatedData);
    console.log('Step data:', stepData);
    console.log('Updated registration data:', updatedData);

    if (registrationStep < 4) {
      setRegistrationStep(registrationStep + 1);
    } else {
      handleFinalRegistration(updatedData);
    }
  };

  const handleFinalRegistration = async (finalData: any) => {
    console.log('Final registration data:', finalData);
    
    // Validar que tenemos email y password
    if (!finalData.email || !finalData.password) {
      toast.error("Email y contraseña son requeridos");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(finalData.email, finalData.password, finalData);
      
      if (error) {
        console.error('Registration error:', error);
        throw error;
      }
      
      // Si no hay error, el registro fue exitoso
      toast.success("¡Cuenta creada exitosamente! Ya puedes empezar a usar la plataforma.");
      
      // Reset state y cerrar modal
      setRegistrationStep(1);
      setRegistrationData({});
      onClose();
      
      // Mostrar modal de verificación después del registro exitoso
      setTimeout(() => {
        setShowVerificationModal(true);
      }, 500);
      
    } catch (error: any) {
      console.error("Error during registration:", error);
      if (error.message?.includes("User already registered")) {
        toast.error("Este email ya está registrado. Intenta iniciar sesión.");
      } else if (error.message?.includes("Password should be")) {
        toast.error("La contraseña debe tener al menos 6 caracteres.");
      } else if (error.message?.includes("anonymous_provider_disabled")) {
        toast.error("Error de configuración. Por favor, verifica que el email y contraseña estén completos.");
      } else if (error.message?.includes("Email not confirmed")) {
        setShowEmailConfirmation(true);
      } else {
        toast.error("Error al crear la cuenta. Inténtalo de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailConfirmed = () => {
    setShowEmailConfirmation(false);
    onClose();
  };

  const handleBackStep = () => {
    if (registrationStep > 1) {
      setRegistrationStep(registrationStep - 1);
    }
  };

  const renderRegistrationStep = () => {
    switch (registrationStep) {
      case 1:
        return (
          <BasicInfoForm 
            onSubmit={handleRegistrationStepSubmit}
            initialData={registrationData}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <RunnerProfileForm 
            onSubmit={handleRegistrationStepSubmit}
            onBack={handleBackStep}
            initialData={registrationData}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <EmergencyContactForm 
            onSubmit={handleRegistrationStepSubmit}
            onBack={handleBackStep}
            initialData={registrationData}
            isLoading={isLoading}
          />
        );
      case 4:
        return (
          <RoleSelectionForm 
            onSubmit={handleRegistrationStepSubmit}
            onBack={handleBackStep}
            initialData={registrationData}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  const handleCloseModal = () => {
    onClose();
    // Reset state when closing
    setRegistrationStep(1);
    setRegistrationData({});
    setShowEmailConfirmation(false);
  };

  // Modal de confirmación de email (solo se muestra si hay error específico de confirmación)
  if (showEmailConfirmation) {
    return (
      <Dialog open={true} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex items-center justify-between p-0 mb-6">
            <div className="flex items-center space-x-2">
              <img src="/lovable-uploads/981505bd-2f25-4665-9b98-5496d5124ebe.png" alt="RunnersHEx" className="h-8 w-8" />
              <span className="font-bold text-xl text-gray-900">RunnersHEx</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleCloseModal}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <Mail className="h-16 w-16 text-blue-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Cuenta Creada Exitosamente!</h2>
              <p className="text-gray-600">Para completar tu registro, confirma tu email</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm text-blue-800 font-medium mb-2">
                    Revisa tu bandeja de entrada para confirmar tu email y activar tu cuenta.
                  </p>
                  <p className="text-xs text-blue-700">
                    <strong>Emisor:</strong> noreply@mail.app.supabase.io
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm text-yellow-800 font-medium mb-1">
                    ¿No encuentras el email?
                  </p>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    <li>• Revisa tu carpeta de <strong>Correos No Deseados/Spam</strong></li>
                    <li>• Busca el remitente: <strong>noreply@mail.app.supabase.io</strong></li>
                    <li>• El email puede tardar unos minutos en llegar</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>Próximo paso:</strong> Después de confirmar tu email, inicia sesión con tus credenciales para acceder a la plataforma.
              </p>
            </div>

            <Button 
              onClick={handleEmailConfirmed}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-0 mb-6">
            <div className="flex items-center space-x-2">
              <img src="/lovable-uploads/981505bd-2f25-4665-9b98-5496d5124ebe.png" alt="RunnersHEx" className="h-8 w-8" />
              <span className="font-bold text-xl text-gray-900">RunnersHEx</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseModal}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {mode === "login" ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h2>
                <p className="text-gray-600 mt-2">Accede a tu cuenta de runner</p>
              </div>
              
              <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  ¿No tienes cuenta?{" "}
                  <button
                    onClick={() => onModeChange("register")}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Créate una aquí
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Crear Cuenta - Paso {registrationStep} de 4
                </h2>
                <p className="text-gray-600 mt-2">Únete a la comunidad de runners</p>
              </div>

              {/* Progress indicator */}
              <div className="flex space-x-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 h-2 rounded-full ${
                      step <= registrationStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {renderRegistrationStep()}
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  ¿Ya tienes cuenta?{" "}
                  <button
                    onClick={() => onModeChange("login")}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Inicia sesión aquí
                  </button>
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <VerificationRequiredModal 
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
      />
    </>
  );
};

export default AuthModalIntegrated;
