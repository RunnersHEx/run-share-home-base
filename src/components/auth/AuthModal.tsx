import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Lock, Calendar, MapPin, Trophy } from "lucide-react";
import { toast } from "sonner";
import LegalModal from "@/components/legal/LegalModal";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "login" | "register";
  onModeChange: (mode: "login" | "register") => void;
}

const AuthModal = ({ isOpen, onClose, mode, onModeChange }: AuthModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [legalModal, setLegalModal] = useState<{
    isOpen: boolean;
    type: "privacy-policy" | "terms-conditions" | null;
  }>({
    isOpen: false,
    type: null
  });
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    bio: "",
    runningExperience: "",
    preferredRaceTypes: [] as string[],
    emergencyContactName: "",
    emergencyContactPhone: "",
    isHost: false,
    isGuest: false,
    agreeToPrivacyPolicy: false,
    agreeToTermsConditions: false
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

  const openLegalModal = (type: "privacy-policy" | "terms-conditions") => {
    setLegalModal({ isOpen: true, type });
  };

  const closeLegalModal = () => {
    setLegalModal({ isOpen: false, type: null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "register") {
        // Validate legal acceptance requirements as per document specifications
        if (!formData.agreeToPrivacyPolicy) {
          toast.error("Debes leer y aceptar la Política de Privacidad para continuar");
          return;
        }
        if (!formData.agreeToTermsConditions) {
          toast.error("Debes aceptar los Términos y Condiciones para continuar");
          return;
        }
        if (!formData.isHost && !formData.isGuest) {
          toast.error("Debes seleccionar al menos un rol (Host o Guest)");
          return;
        }
        // Registration logic would go here
        console.log("Registration data:", formData);
        toast.success("¡Cuenta creada exitosamente! Te hemos enviado un email de verificación.");
      } else {
        // Login logic would go here
        console.log("Login attempt:", { email: formData.email, password: formData.password });
        toast.success("¡Bienvenido de vuelta!");
      }
      onClose();
    } catch (error) {
      toast.error("Ha ocurrido un error. Por favor, inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Tu contraseña"
                      className="pl-10"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full runner-button-primary" disabled={isLoading}>
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>

                <div className="text-center">
                  <Button variant="link" className="text-runner-blue-600">
                    ¿Olvidaste tu contraseña?
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input
                        id="firstName"
                        placeholder="Nombre"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellidos</Label>
                      <Input
                        id="lastName"
                        placeholder="Apellidos"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-register">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email-register"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-register">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password-register"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        className="pl-10"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+34 123 456 789"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Running Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Trophy className="mr-2 h-5 w-5 text-runner-orange-500" />
                    Perfil Runner
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="runningExperience">Años de experiencia corriendo</Label>
                    <Select onValueChange={(value) => handleInputChange("runningExperience", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu experiencia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1">Menos de 1 año</SelectItem>
                        <SelectItem value="1-3">1-3 años</SelectItem>
                        <SelectItem value="3-5">3-5 años</SelectItem>
                        <SelectItem value="5-10">5-10 años</SelectItem>
                        <SelectItem value="10+">Más de 10 años</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipos de carrera preferidos (selecciona varios)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["5K", "10K", "Media Maratón", "Maratón", "Trail", "Ultra", "Triatlón"].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox 
                            id={type}
                            checked={formData.preferredRaceTypes.includes(type)}
                            onCheckedChange={() => handleRaceTypeToggle(type)}
                          />
                          <Label htmlFor={type} className="text-sm">{type}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Cuéntanos sobre ti</Label>
                    <textarea
                      id="bio"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-runner-blue-500 focus:border-runner-blue-500"
                      placeholder="Háblanos de tu experiencia corriendo, motivaciones, logros..."
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                {/* Role Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">¿Cómo quieres usar la plataforma?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-runner-blue-500 transition-colors"
                         onClick={() => handleInputChange("isHost", !formData.isHost)}>
                      <div className="flex items-center space-x-2 mb-2">
                        <Checkbox 
                          checked={formData.isHost} 
                          onCheckedChange={(checked) => handleInputChange("isHost", checked)}
                        />
                        <Label className="font-semibold text-runner-blue-700">Quiero ser Host</Label>
                      </div>
                      <p className="text-sm text-gray-600">
                        Ofrecer mi casa y conocimiento local a corredores que visiten mi zona
                      </p>
                    </div>
                    
                    <div className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-runner-orange-500 transition-colors"
                         onClick={() => handleInputChange("isGuest", !formData.isGuest)}>
                      <div className="flex items-center space-x-2 mb-2">
                        <Checkbox 
                          checked={formData.isGuest} 
                          onCheckedChange={(checked) => handleInputChange("isGuest", checked)}
                        />
                        <Label className="font-semibold text-runner-orange-700">Quiero ser Guest</Label>
                      </div>
                      <p className="text-sm text-gray-600">
                        Buscar alojamiento y experiencia local cuando viaje a otras carreras
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Contacto de Emergencia</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactName">Nombre</Label>
                      <Input
                        id="emergencyContactName"
                        placeholder="Nombre del contacto"
                        value={formData.emergencyContactName}
                        onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactPhone">Teléfono</Label>
                      <Input
                        id="emergencyContactPhone"
                        type="tel"
                        placeholder="+34 123 456 789"
                        value={formData.emergencyContactPhone}
                        onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Legal Acceptance - As per requirements document */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Aceptación Legal</h3>
                  
                  {/* Privacy Policy Acceptance */}
                  <div className="flex items-start space-x-2 p-3 border border-gray-200 rounded-lg">
                    <Checkbox 
                      id="privacy-policy"
                      checked={formData.agreeToPrivacyPolicy}
                      onCheckedChange={(checked) => handleInputChange("agreeToPrivacyPolicy", checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="privacy-policy" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
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
                      id="terms-conditions"
                      checked={formData.agreeToTermsConditions}
                      onCheckedChange={(checked) => handleInputChange("agreeToTermsConditions", checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="terms-conditions" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
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

                <Button type="submit" className="w-full runner-button-primary" disabled={isLoading}>
                  {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Legal Modal for Privacy Policy and Terms & Conditions */}
      {legalModal.type && (
        <LegalModal 
          isOpen={legalModal.isOpen}
          onClose={closeLegalModal}
          type={legalModal.type}
        />
      )}
    </>
  );
};

export default AuthModal;