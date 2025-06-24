
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, AlertCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VerificationRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VerificationRequiredModal = ({ isOpen, onClose }: VerificationRequiredModalProps) => {
  const navigate = useNavigate();

  const handleVerifyIdentity = () => {
    onClose();
    navigate("/profile", { state: { activeSection: "verification" } });
  };

  const handleRemindLater = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2 text-xl">
              <Shield className="h-6 w-6 text-blue-600" />
              <span>Verificación de Identidad Requerida</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800">
                  Para continuar disfrutando de la comunidad RunnersHEx necesitamos verificar tu identidad para asegurar la seguridad de todos nuestros runners.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">¿Por qué es necesario?</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start space-x-2">
                <span className="text-blue-600">•</span>
                <span><strong>Como Host:</strong> Alojarás corredores desconocidos en tu casa, la verificación te da seguridad sobre quién aceptas.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600">•</span>
                <span><strong>Como Guest:</strong> Sabrás que la identidad del Host ha sido verificada, dándote confianza para enviar solicitudes.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600">•</span>
                <span><strong>Para todos:</strong> Garantizamos una comunidad segura y de confianza mutua.</span>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h5 className="font-medium text-yellow-800 mb-2">Proceso de verificación:</h5>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Nuestro equipo revisará tus documentos en 24-48 horas</li>
              <li>• Te notificaremos el resultado por email</li>
              <li>• Puedes usar la plataforma mientras esperas la verificación</li>
              <li>• Si hay algún problema, se bloqueará el perfil hasta solucionarlo</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              onClick={handleVerifyIdentity}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Shield className="h-4 w-4 mr-2" />
              Verificar Identidad
            </Button>
            <Button 
              onClick={handleRemindLater}
              variant="outline"
              className="flex-1"
            >
              Recordármelo después
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationRequiredModal;
