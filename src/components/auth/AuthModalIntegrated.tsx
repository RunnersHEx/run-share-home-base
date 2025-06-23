
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
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

  const handleLogin = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      toast.success("¡Bienvenido de vuelta!");
      onClose();
    } catch (error: any) {
      console.error("Error during login:", error);
      if (error.message?.includes("Invalid login credentials")) {
        toast.error("Credenciales incorrectas. Verifica tu email y contraseña.");
      } else if (error.message?.includes("Email not confirmed")) {
        toast.error("Por favor, confirma tu email antes de iniciar sesión.");
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

    if (registrationStep < 5) {
      setRegistrationStep(registrationStep + 1);
    } else {
      handleFinalRegistration(updatedData);
    }
  };

  const handleFinalRegistration = async (finalData: any) => {
    setIsLoading(true);
    try {
      await signUp(finalData.email, finalData.password, finalData);
      toast.success("¡Cuenta creada exitosamente! Revisa tu email para confirmar tu cuenta.");
      onClose();
      // Mostrar modal de verificación después del registro exitoso
      setShowVerificationModal(true);
      // Reset state
      setRegistrationStep(1);
      setRegistrationData({});
    } catch (error: any) {
      console.error("Error during registration:", error);
      if (error.message?.includes("User already registered")) {
        toast.error("Este email ya está registrado. Intenta iniciar sesión.");
      } else if (error.message?.includes("Password should be")) {
        toast.error("La contraseña debe tener al menos 6 caracteres.");
      } else {
        toast.error("Error al crear la cuenta. Inténtalo de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
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
  };

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
