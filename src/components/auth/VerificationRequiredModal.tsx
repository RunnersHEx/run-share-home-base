
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, AlertCircle, FileText, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useVerification } from "@/hooks/useVerification";

interface VerificationRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VerificationRequiredModal = ({ isOpen, onClose }: VerificationRequiredModalProps) => {
  const navigate = useNavigate();
  const { requiredDocuments, isLoading, hasUploadedDocuments } = useVerification();

  // Don't render modal if verification data is still loading
  if (isLoading) {
    return null;
  }

  // Don't render modal if user has already uploaded the required documents
  if (hasUploadedDocuments) {
    return null;
  }

  const handleVerifyIdentity = () => {
    onClose();
    navigate("/profile", { state: { activeSection: "verification" } });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <span className="leading-tight">Verificación de Identidad Requerida</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                  Para continuar usando RunnersHEx, necesitas subir los documentos de verificación. Una vez subidos, tendrás acceso inmediato a todas las funciones.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h4 className="font-medium sm:font-semibold text-sm sm:text-base text-gray-900">Documentos Requeridos para Continuar:</h4>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-blue-50 rounded-lg">
                <FileText className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${requiredDocuments.id_document ? 'text-green-600' : 'text-blue-600'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-sm">Documento de Identidad</p>
                  <p className="text-[10px] sm:text-xs text-gray-600">DNI, pasaporte o carnet de conducir</p>
                </div>
                {requiredDocuments.id_document && <span className="text-green-600 text-xs sm:text-sm font-medium flex-shrink-0">✓ Subido</span>}
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-blue-50 rounded-lg">
                <Camera className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${requiredDocuments.selfie_with_id ? 'text-green-600' : 'text-blue-600'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-sm">Selfie con tu ID</p>
                  <p className="text-[10px] sm:text-xs text-gray-600">Foto tuya sosteniendo tu documento</p>
                </div>
                {requiredDocuments.selfie_with_id && <span className="text-green-600 text-xs sm:text-sm font-medium flex-shrink-0">✓ Subido</span>}
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
            <h5 className="font-medium text-sm sm:text-base text-green-800 mb-2">¡Acceso Inmediato!</h5>
            <ul className="text-xs sm:text-sm text-green-700 space-y-1">
              <li>• <strong>Sube los documentos</strong> y accede inmediatamente a la plataforma</li>
              <li>• No necesitas esperar la revisión del administrador</li>
              <li>• Una vez subidos, podrás usar todas las funciones</li>
              <li>• Nuestro equipo los revisará posteriormente para verificación final</li>
            </ul>
          </div>

          <div className="flex justify-center pt-2 sm:pt-4">
            <Button 
              onClick={handleVerifyIdentity}
              className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base h-10 sm:h-11"
            >
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="truncate">Verificar Identidad Ahora</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationRequiredModal;
