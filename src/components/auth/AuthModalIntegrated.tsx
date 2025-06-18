
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/auth/forms/LoginForm";
import BasicInfoForm from "@/components/auth/forms/BasicInfoForm";
import RunnerProfileForm from "@/components/auth/forms/RunnerProfileForm";
import RoleSelectionForm from "@/components/auth/forms/RoleSelectionForm";
import EmergencyContactForm from "@/components/auth/forms/EmergencyContactForm";

interface AuthModalIntegratedProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "login" | "register";
  onModeChange: (mode: "login" | "register") => void;
}

const AuthModalIntegrated = ({ isOpen, onClose, mode, onModeChange }: AuthModalIntegratedProps) => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    bio: "",
    runningExperience: "",
    raceModality: "",
    preferredRaceTypes: [] as string[],
    emergencyContactName: "",
    emergencyContactPhone: "",
    isHost: false,
    isGuest: false,
    agreeToTerms: false
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRaceTypeToggle = (raceType: string) => {
    setFormData(prev => ({
      ...prev,
      preferredRaceTypes: prev.preferredRaceTypes.includes(raceType)
        ? prev.preferredRaceTypes.filter(type => type !== raceType)
        : [...prev.preferredRaceTypes, raceType]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "register") {
        if (!formData.agreeToTerms) {
          toast.error("Debes aceptar los términos y condiciones");
          return;
        }
        if (!formData.isHost && !formData.isGuest) {
          toast.error("Debes seleccionar al menos un rol (Host o Guest)");
          return;
        }
        
        await signUp(formData.email, formData.password, formData);
        toast.success("¡Cuenta creada exitosamente! Te hemos enviado un email de verificación.");
      } else {
        await signIn(formData.email, formData.password);
        toast.success("¡Bienvenido de vuelta!");
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Ha ocurrido un error. Por favor, inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) {
      toast.error("Por favor ingresa tu email");
      return;
    }
    
    try {
      await resetPassword(formData.email);
      toast.success("Te hemos enviado un email para restablecer tu contraseña");
    } catch (error: any) {
      toast.error(error.message || "Error al enviar email de recuperación");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(value) => onModeChange(value as "login" | "register")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register">Registrarse</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-6">
            <LoginForm
              formData={formData}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              onPasswordReset={handlePasswordReset}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="register" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <BasicInfoForm
                formData={formData}
                onInputChange={handleInputChange}
              />

              <Separator />

              <RunnerProfileForm
                formData={formData}
                onInputChange={handleInputChange}
                onRaceTypeToggle={handleRaceTypeToggle}
              />

              <Separator />

              <RoleSelectionForm
                formData={formData}
                onInputChange={handleInputChange}
              />

              <Separator />

              <EmergencyContactForm
                formData={formData}
                onInputChange={handleInputChange}
              />

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked)}
                />
                <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                  Acepto los <Button variant="link" className="p-0 h-auto text-blue-600">términos y condiciones</Button> y la <Button variant="link" className="p-0 h-auto text-blue-600">política de privacidad</Button> de Runners Home Exchange
                </Label>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModalIntegrated;
