
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import BasicInfoForm from "./forms/BasicInfoForm";
import RunnerProfileForm from "./forms/RunnerProfileForm";
import EmergencyContactForm from "./forms/EmergencyContactForm";
import RoleSelectionForm from "./forms/RoleSelectionForm";
import LoginForm from "./forms/LoginForm";
import VerificationRequiredModal from "./VerificationRequiredModal";
import { X } from "lucide-react";

interface AuthModalIntegratedProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "login" | "register";
  onModeChange: (mode: "login" | "register") => void;
}

const AuthModalIntegrated = ({ isOpen, onClose, mode, onModeChange }: AuthModalIntegratedProps) => {
  const { signUp, signIn } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  const [formData, setFormData] = useState({
    // Información básica
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    birthDate: "",
    
    // Información del corredor
    bio: "",
    runningExperience: "",
    preferredDistances: [] as string[],
    runningModalities: [] as string[],
    personalRecords: {} as Record<string, string>,
    racesCompletedThisYear: 0,
    
    // Contacto de emergencia
    emergencyContactName: "",
    emergencyContactPhone: "",
    
    // Roles (por defecto ambos true como es obligatorio)
    isHost: true,
    isGuest: true
  });

  const handleStepSubmit = (stepData: any) => {
    console.log('Handling step submit:', currentStep, stepData);
    setFormData(prev => {
      const newData = { ...prev, ...stepData };
      console.log('Updated form data:', newData);
      return newData;
    });
    
    // Lógica de navegación de pasos corregida
    if (mode === "register") {
      if (currentStep === 1) {
        // Después de paso 1 (Info básica), saltar paso 2 (Runner info) y ir a paso 3 (Emergencia)
        setCurrentStep(3);
      } else if (currentStep === 3) {
        // Después de paso 3 (Emergencia), ir a paso 4 (Roles)
        setCurrentStep(4);
      } else if (currentStep === 4) {
        // Último paso - crear cuenta
        handleFinalSubmit({ ...formData, ...stepData });
      }
    }
  };

  const handleFinalSubmit = async (finalData: typeof formData) => {
    setIsLoading(true);
    console.log('Final submit with data:', finalData);
    
    try {
      // Validar que tenemos todos los datos necesarios
      if (!finalData.email || !finalData.password) {
        toast.error("Email y contraseña son requeridos");
        setIsLoading(false);
        return;
      }

      // Preparar datos para Supabase con todos los campos del formulario
      const userData = {
        firstName: finalData.firstName,
        lastName: finalData.lastName,
        phone: finalData.phone,
        birthDate: finalData.birthDate,
        bio: finalData.bio,
        runningExperience: finalData.runningExperience,
        runningModalities: finalData.runningModalities,
        preferredDistances: finalData.preferredDistances,
        personalRecords: finalData.personalRecords,
        racesCompletedThisYear: finalData.racesCompletedThisYear,
        emergencyContactName: finalData.emergencyContactName,
        emergencyContactPhone: finalData.emergencyContactPhone,
        isHost: finalData.isHost,
        isGuest: finalData.isGuest
      };

      console.log('Calling signUp with userData:', userData);
      
      const { error } = await signUp(finalData.email, finalData.password, userData);
      
      if (error) {
        console.error('SignUp error:', error);
        if (error.message?.includes('User already registered')) {
          toast.error("Este email ya está registrado. Intenta iniciar sesión.");
        } else if (error.message?.includes('Invalid email')) {
          toast.error("El formato del email no es válido");
        } else if (error.message?.includes('Password')) {
          toast.error("La contraseña no cumple los requisitos mínimos");
        } else {
          toast.error(error.message || "Error al crear la cuenta");
        }
      } else {
        toast.success("¡Cuenta creada exitosamente!");
        onClose();
        
        // Mostrar modal de verificación después de un breve delay
        setTimeout(() => {
          setShowVerificationModal(true);
        }, 1000);
        
        // Reset form
        resetForm();
      }
    } catch (error) {
      console.error('Error in final submit:', error);
      toast.error("Error inesperado al crear la cuenta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (loginData: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      await signIn(loginData.email, loginData.password);
      toast.success("¡Has iniciado sesión correctamente!");
      onClose();
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message?.includes('Invalid credentials')) {
        toast.error("Email o contraseña incorrectos");
      } else {
        toast.error(error.message || "Error al iniciar sesión");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 3) {
      // Desde paso 3 (emergencia) volver a paso 1 (básica)
      setCurrentStep(1);
    } else if (currentStep === 4) {
      // Desde paso 4 (roles) volver a paso 3 (emergencia)
      setCurrentStep(3);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      birthDate: "",
      bio: "",
      runningExperience: "",
      preferredDistances: [],
      runningModalities: [],
      personalRecords: {},
      racesCompletedThisYear: 0,
      emergencyContactName: "",
      emergencyContactPhone: "",
      isHost: true,
      isGuest: true
    });
  };

  const resetAndClose = () => {
    resetForm();
    onClose();
  };

  const renderStep = () => {
    if (mode === "login") {
      return (
        <LoginForm 
          onSubmit={handleLoginSubmit} 
          isLoading={isLoading}
          onModeChange={() => onModeChange("register")}
        />
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <BasicInfoForm
            onSubmit={handleStepSubmit}
            initialData={formData}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <EmergencyContactForm
            onSubmit={handleStepSubmit}
            onBack={handleBack}
            initialData={formData}
            isLoading={isLoading}
          />
        );
      case 4:
        return (
          <RoleSelectionForm
            onSubmit={handleStepSubmit}
            onBack={handleBack}
            initialData={formData}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    if (mode === "login") {
      return "Iniciar Sesión";
    }
    
    const stepTitles = {
      1: "Paso 1 de 3",
      3: "Paso 2 de 3", 
      4: "Paso 3 de 3"
    };
    
    return `Crear Cuenta - ${stepTitles[currentStep as keyof typeof stepTitles]}`;
  };

  const getSubtitle = () => {
    if (mode === "login") {
      return "Accede a tu cuenta de runner";
    }
    return "Únete a la comunidad de runners";
  };

  // Función para obtener el número de paso actual para mostrar en el progreso
  const getCurrentStepForProgress = () => {
    const stepMapping = { 1: 1, 3: 2, 4: 3 };
    return stepMapping[currentStep as keyof typeof stepMapping] || 1;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={resetAndClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/981505bd-2f25-4665-9b98-5496d5124ebe.png" 
                alt="RunnersHEx" 
                className="h-8 w-8"
              />
              <span className="font-bold text-xl text-gray-900">RunnersHEx</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetAndClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {getTitle()}
            </h2>
            <p className="text-gray-600">
              {getSubtitle()}
            </p>
          </div>

          {mode === "register" && (
            <div className="flex items-center justify-center mb-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= getCurrentStepForProgress() 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-12 h-1 mx-2 ${
                      step < getCurrentStepForProgress() ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {renderStep()}

          {mode === "login" && (
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                ¿No tienes cuenta?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium text-blue-600"
                  onClick={() => onModeChange("register")}
                >
                  Regístrate aquí
                </Button>
              </p>
            </div>
          )}

          {mode === "register" && (
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium text-blue-600"
                  onClick={() => onModeChange("login")}
                >
                  Inicia sesión aquí
                </Button>
              </p>
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
