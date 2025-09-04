
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import BasicInfoForm from "./forms/BasicInfoForm";
import EmergencyContactForm from "./forms/EmergencyContactForm";
import RoleSelectionForm from "./forms/RoleSelectionForm";
import SubscriptionForm from "./forms/SubscriptionForm";
import LoginForm from "./forms/LoginForm";
import PasswordResetForm from "./forms/PasswordResetForm";
import VerificationRequiredModal from "./VerificationRequiredModal";
import MFAVerification from "./MFAVerification";
import { useMFA } from "@/hooks/useMFA";
import { requiresMFA, isMFACodeVerified, clearMFACode } from "@/services/mfa/mfaService";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { supabase } from "@/integrations/supabase/client";

interface AuthModalIntegratedProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "login" | "register";
  onModeChange: (mode: "login" | "register") => void;
}

const AuthModalIntegrated = ({ isOpen, onClose, mode, onModeChange }: AuthModalIntegratedProps) => {
  const { signUp, signIn, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [currentMode, setCurrentMode] = useState<"login" | "register" | "forgot-password" | "mfa">(mode);
  
  // MFA state
  const [pendingLoginData, setPendingLoginData] = useState<{ email: string; password: string; recaptchaToken?: string } | null>(null);
  const { checkMFARequired } = useMFA();
  
  // Sync currentMode with prop mode
  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    birthDate: "",
    bio: "",
    runningExperience: "",
    preferredDistances: [] as string[],
    runningModalities: [] as string[],
    personalRecords: {} as Record<string, string>,
    racesCompletedThisYear: 0,
    emergencyContactName: "",
    emergencyContactPhone: "",
    isHost: true,
    isGuest: true
  });

  const handleStepSubmit = (stepData: any) => {
    console.log('AuthModal: Step submit for step:', currentStep);
    
    const newData = { ...formData, ...stepData };
    setFormData(newData);
    
    if (mode === "register") {
      if (currentStep === 1) {
        setCurrentStep(3);
      } else if (currentStep === 3) {
        setCurrentStep(4);
      } else if (currentStep === 4) {
        setCurrentStep(5);
      } else if (currentStep === 5) {
        // Subscription step completed - redirect to Stripe with registration data
        console.log('AuthModal: Subscription step completed, redirecting to Stripe with registration data');
        handleStripeRedirectWithRegistration(newData);
      }
    }
  };

  // Handle Stripe redirect with registration data (account created after payment)
  const handleStripeRedirectWithRegistration = async (finalData: typeof formData) => {
    console.log('AuthModal: Preparing Stripe redirect with registration data');
    
    setSubmitting(true);
    
    try {
      // Validations
      if (!finalData.email?.trim() || !finalData.password) {
        toast.error("Email y contraseña son requeridos");
        return;
      }

      if (finalData.password !== finalData.confirmPassword) {
        toast.error("Las contraseñas no coinciden");
        return;
      }

      if (finalData.password.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres");
        return;
      }

      // Prepare complete registration data for Stripe metadata
      const registrationMetadata = {
        email: finalData.email.trim(),
        password: finalData.password, // Note: In production, consider hashing this
        firstName: finalData.firstName,
        lastName: finalData.lastName,
        phone: finalData.phone,
        birthDate: finalData.birthDate,
        bio: finalData.bio,
        runningExperience: finalData.runningExperience,
        runningModalities: JSON.stringify(finalData.runningModalities),
        preferredDistances: JSON.stringify(finalData.preferredDistances),
        personalRecords: JSON.stringify(finalData.personalRecords),
        racesCompletedThisYear: finalData.racesCompletedThisYear.toString(),
        emergencyContactName: finalData.emergencyContactName,
        emergencyContactPhone: finalData.emergencyContactPhone,
        isHost: finalData.isHost.toString(),
        isGuest: finalData.isGuest.toString(),
        recaptchaToken: finalData.recaptchaToken,
        createAccount: "true" // Flag to tell webhook to create account
      };

      console.log('AuthModal: Creating Stripe session with registration data');
      
      // Create Stripe session with registration data (no auth needed since no account exists)
      const response = await supabase.functions.invoke('create-subscription-with-registration', {
        body: { 
          couponCode: finalData.couponCode,
          registrationData: registrationMetadata
        }
      });

      if (response.error) {
        console.error('AuthModal: Stripe session creation error:', response.error);
        toast.error(response.error.message || 'Error al procesar el pago');
        return;
      }

      if (response.data?.url) {
        console.log('AuthModal: Redirecting to Stripe checkout');
        toast.success('Redirigiendo al pago...');
        // Close modal before redirect
        resetForm();
        onClose();
        // Redirect to Stripe
        window.location.href = response.data.url;
      } else {
        toast.error('No se recibió URL de checkout');
      }
    } catch (error: any) {
      console.error('AuthModal: Stripe redirect failed:', error);
      toast.error(error.message || 'Error al procesar el pago');
    } finally {
      setSubmitting(false);
    }
  };

  // This will be called when user completes registration without subscription
  const handleSkipSubscription = async () => {
    console.log('AuthModal: Skipping subscription, completing registration');
    await handleFinalSubmit(formData);
  };

  const handleFinalSubmit = async (finalData: typeof formData) => {
    console.log('AuthModal: Final registration submit');
    
    setSubmitting(true);
    
    try {
      // Validaciones básicas
      if (!finalData.email?.trim() || !finalData.password) {
        toast.error("Email y contraseña son requeridos");
        return;
      }

      if (finalData.password !== finalData.confirmPassword) {
        toast.error("Las contraseñas no coinciden");
        return;
      }

      if (finalData.password.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres");
        return;
      }

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
        isGuest: finalData.isGuest,
        // Include subscription data for post-registration processing
        subscriptionData: finalData.selectedPlan ? {
          couponCode: finalData.couponCode,
          plannedPrice: finalData.plannedPrice,
          savings: finalData.savings
        } : null
      };

      console.log('AuthModal: Attempting user registration');
      
      const { error } = await signUp(finalData.email.trim(), finalData.password, userData, finalData.recaptchaToken);
      
      if (error) {
        console.error('AuthModal: Registration error:', error);
        
        let errorMessage = "Error al crear la cuenta";
        
        if (error.message?.includes('User already registered')) {
          errorMessage = "Este email ya está registrado. Intenta iniciar sesión.";
        } else if (error.message?.includes('Invalid email')) {
          errorMessage = "El formato del email no es válido";
        } else if (error.message?.includes('Password')) {
          errorMessage = "La contraseña no cumple los requisitos mínimos";
        } else if (error.message?.includes('Email rate limit exceeded')) {
          errorMessage = "Demasiados intentos. Espera un momento antes de intentar de nuevo.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast.error(errorMessage);
      } else {
        console.log('AuthModal: Registration successful');
        
        // If user selected a subscription plan, redirect to Stripe checkout
        if (finalData.selectedPlan && finalData.couponCode !== undefined) {
          console.log('AuthModal: Processing subscription with coupon:', finalData.couponCode);
          toast.success("¡Cuenta creada! Redirigiendo al pago...");
          
          // Wait a moment for the account to be fully created and user to be logged in
          setTimeout(async () => {
            await handleSubscriptionAfterRegistration(finalData.couponCode);
          }, 2000);
        } else {
          // No subscription selected, show success and verification modal
          toast.success("¡Cuenta creada exitosamente! Revisa tu email para verificar tu cuenta.");
          resetForm();
          onClose();
          
          setTimeout(() => {
            setShowVerificationModal(true);
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error('AuthModal: Registration exception:', error);
      toast.error(error.message || "Error inesperado al crear la cuenta");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginSubmit = async (loginData: { email: string; password: string; recaptchaToken?: string }) => {
    console.log('AuthModal: Login submit attempt');
    
    if (submitting || authLoading) {
      console.log('AuthModal: Already processing, skipping');
      return;
    }
    
    // Check if MFA is required for this email
    const needsMFA = checkMFARequired(loginData.email);
    
    if (needsMFA) {
      console.log('AuthModal: MFA required for email:', loginData.email);
      // Store login data and switch to MFA mode
      setPendingLoginData(loginData);
      setCurrentMode('mfa');
      return;
    }
    
    // Proceed with normal login for non-admin emails
    await proceedWithLogin(loginData);
  };

  const proceedWithLogin = async (loginData: { email: string; password: string; recaptchaToken?: string }) => {
    setSubmitting(true);
    
    try {
      await signIn(loginData.email, loginData.password, loginData.recaptchaToken);
      console.log('AuthModal: Login successful, closing modal');
      
      // Close the modal immediately after successful login
      toast.success('¡Bienvenido de vuelta!');
      resetForm();
      onClose();
      
    } catch (error: any) {
      console.error('AuthModal: Login error:', error);
      toast.error(error.message || "Error al iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMFAVerified = async () => {
    console.log('AuthModal: MFA verified, proceeding with login');
    
    if (!pendingLoginData) {
      toast.error('Error: No hay datos de login pendientes');
      setCurrentMode('login');
      return;
    }
    
    // Clear the MFA code and proceed with login
    clearMFACode(pendingLoginData.email);
    await proceedWithLogin(pendingLoginData);
    setPendingLoginData(null);
  };

  const handleMFACancel = () => {
    console.log('AuthModal: MFA cancelled, returning to login');
    setPendingLoginData(null);
    setCurrentMode('login');
  };

  const handleBack = () => {
    if (currentStep === 3) {
      setCurrentStep(1);
    } else if (currentStep === 4) {
      setCurrentStep(3);
    } else if (currentStep === 5) {
      setCurrentStep(4);
    }
  };

  const resetForm = () => {
    console.log('AuthModal: Resetting form');
    setCurrentStep(1);
    setSubmitting(false);
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

  const handleClose = () => {
    if (submitting || authLoading) {
      console.log('AuthModal: Cannot close while loading');
      return;
    }
    
    console.log('AuthModal: Handling close');
    resetForm();
    onClose();
  };

  const handleModeChange = (newMode: "login" | "register") => {
    if (submitting || authLoading) return;
    
    console.log('AuthModal: Mode change to:', newMode);
    resetForm();
    setPendingLoginData(null); // Clear any pending MFA data
    setCurrentMode(newMode);
    onModeChange(newMode);
  };
  
  const handleForgotPassword = () => {
    console.log('AuthModal: Switching to forgot password mode');
    setCurrentMode('forgot-password');
  };
  
  const handleBackToLogin = () => {
    console.log('AuthModal: Switching back to login mode');
    setCurrentMode('login');
  };

  const renderStep = () => {
    if (currentMode === "forgot-password") {
      return (
        <PasswordResetForm 
          onBack={handleBackToLogin}
          onClose={onClose}
        />
      );
    }
    
    if (currentMode === "mfa") {
      if (!pendingLoginData) {
        // Fallback to login if no pending data
        setCurrentMode('login');
        return null;
      }
      
      return (
        <MFAVerification
          email={pendingLoginData.email}
          onVerified={handleMFAVerified}
          onCancel={handleMFACancel}
          hideHeader={true}
        />
      );
    }
    
    if (currentMode === "login") {
      return (
        <LoginForm 
          onSubmit={handleLoginSubmit} 
          isLoading={submitting}
          onModeChange={() => handleModeChange("register")}
          onForgotPassword={handleForgotPassword}
        />
      );
    }

    const isLoading = submitting || authLoading;

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
      case 5:
        return (
          <SubscriptionForm
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
    if (currentMode === "forgot-password") {
      return "Recuperar Contraseña";
    }
    if (currentMode === "mfa") {
      return "Verificación de Seguridad";
    }
    if (currentMode === "login") {
      return "Iniciar Sesión";
    }
    
    const stepTitles = {
      1: "Paso 1 de 4",
      3: "Paso 2 de 4", 
      4: "Paso 3 de 4",
      5: "Paso 4 de 4"
    };
    
    return `Crear Cuenta - ${stepTitles[currentStep as keyof typeof stepTitles]}`;
  };

  const getSubtitle = () => {
    if (currentMode === "forgot-password") {
      return "Te ayudaremos a recuperar el acceso a tu cuenta";
    }
    if (currentMode === "mfa") {
      return "Verifica tu identidad para acceder de forma segura";
    }
    if (currentMode === "login") {
      return "Accede a tu cuenta de runner";
    }
    return "Únete a la comunidad de runners";
  };

  const getCurrentStepForProgress = () => {
    const stepMapping = { 1: 1, 3: 2, 4: 3, 5: 4 };
    return stepMapping[currentStep as keyof typeof stepMapping] || 1;
  };

  const isProcessing = submitting || authLoading;

  return (
    <>
      <Dialog 
        open={isOpen} 
        onOpenChange={isProcessing ? undefined : handleClose}
        // Prevent modal from closing when interacting with reCAPTCHA
        modal={true}
      >
        <DialogContent 
          className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" 
          // Ensure modal content has proper z-index for reCAPTCHA
          style={{ zIndex: 1001 }}
          // Prevent pointer events from bubbling up when clicking on reCAPTCHA
          onPointerDownOutside={(e) => {
            // Don't close modal if clicking on reCAPTCHA elements
            const target = e.target as Element;
            if (target?.closest('.recaptcha-container') || 
                target?.closest('[data-recaptcha]') ||
                target?.closest('iframe[src*="recaptcha"]') ||
                target?.closest('div[style*="z-index: 2147483647"]')) {
              e.preventDefault();
            }
          }}
        >
          <DialogTitle className="sr-only">
            {getTitle()}
          </DialogTitle>
          <VisuallyHidden>
            <DialogDescription>
              {getSubtitle()}
            </DialogDescription>
          </VisuallyHidden>
          
          <div className="flex items-center space-x-2 mb-4">
            <img 
              src="/lovable-uploads/981505bd-2f25-4665-9b98-5496d5124ebe.png" 
              alt="RunnersHEx" 
              className="h-8 w-8"
            />
            <span className="font-bold text-xl text-gray-900">RunnersHEx</span>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {getTitle()}
            </h2>
            <p className="text-gray-600">
              {getSubtitle()}
            </p>
          </div>

          {currentMode === "register" && (
            <div className="flex items-center justify-center mb-6">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= getCurrentStepForProgress() 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`w-12 h-1 mx-2 ${
                      step < getCurrentStepForProgress() ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Hide title and progress for MFA */}
          {currentMode === "mfa" && (
            <div className="mb-4">
              {/* MFA component already has its own header */}
            </div>
          )}

          {renderStep()}

          {currentMode === "register" && (
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium text-blue-600"
                  onClick={() => handleModeChange("login")}
                  disabled={isProcessing}
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
