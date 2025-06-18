
import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { Shield, Upload, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";

const VerificationSection = () => {
  const { profile, uploadVerificationDoc } = useProfile();
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>('');

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedDocType) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo debe ser menor a 10MB');
      return;
    }

    setUploadingDoc(selectedDocType);
    await uploadVerificationDoc(file, selectedDocType);
    setUploadingDoc(null);
    setSelectedDocType('');
  };

  const triggerFileUpload = (docType: string) => {
    setSelectedDocType(docType);
    fileInputRef.current?.click();
  };

  const getVerificationStatus = () => {
    const status = profile?.verification_status || 'pending';
    switch (status) {
      case 'verified':
        return {
          badge: <Badge className="bg-green-100 text-green-800">Verificado</Badge>,
          icon: <CheckCircle className="h-6 w-6 text-green-600" />,
          message: "¡Tu perfil está verificado! Esto aumenta la confianza de otros usuarios."
        };
      case 'pending':
        return {
          badge: <Badge variant="secondary">Pendiente</Badge>,
          icon: <AlertCircle className="h-6 w-6 text-yellow-600" />,
          message: "Tu verificación está pendiente. Sube los documentos requeridos para acelerar el proceso."
        };
      case 'rejected':
        return {
          badge: <Badge variant="destructive">Rechazado</Badge>,
          icon: <AlertCircle className="h-6 w-6 text-red-600" />,
          message: "Tu verificación fue rechazada. Por favor, sube documentos nuevos."
        };
      default:
        return {
          badge: <Badge variant="secondary">Sin verificar</Badge>,
          icon: <Shield className="h-6 w-6 text-gray-600" />,
          message: "Verifica tu perfil para aumentar la confianza en la comunidad."
        };
    }
  };

  const verificationInfo = getVerificationStatus();
  const uploadedDocs = profile?.verification_documents || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {verificationInfo.icon}
            <span>Estado de Verificación</span>
          </div>
          {verificationInfo.badge}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado actual */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-700">{verificationInfo.message}</p>
        </div>

        {/* Documentos requeridos */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Documentos de Verificación</h4>
          
          <div className="space-y-3">
            {/* ID Oficial */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Documento de Identidad</p>
                    <p className="text-sm text-gray-600">
                      DNI, pasaporte o carnet de conducir oficial
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => triggerFileUpload('id_document')}
                  variant="outline"
                  size="sm"
                  disabled={uploadingDoc === 'id_document'}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingDoc === 'id_document' ? 'Subiendo...' : 'Subir'}
                </Button>
              </div>
              {uploadedDocs.some(doc => doc.includes('id_document')) && (
                <div className="mt-2 flex items-center text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Documento subido
                </div>
              )}
            </div>

            {/* Foto en carrera */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Foto en Carrera</p>
                    <p className="text-sm text-gray-600">
                      Foto tuya corriendo o con medalla de finisher donde se te reconozca
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => triggerFileUpload('race_photo')}
                  variant="outline"
                  size="sm"
                  disabled={uploadingDoc === 'race_photo'}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingDoc === 'race_photo' ? 'Subiendo...' : 'Subir'}
                </Button>
              </div>
              {uploadedDocs.some(doc => doc.includes('race_photo')) && (
                <div className="mt-2 flex items-center text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Foto subida
                </div>
              )}
            </div>

            {/* Referencias (opcional) */}
            <div className="border rounded-lg p-4 opacity-75">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Referencias de Running Club (Opcional)</p>
                    <p className="text-sm text-gray-600">
                      Carta de recomendación de tu club de running o entrenador
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => triggerFileUpload('reference')}
                  variant="outline"
                  size="sm"
                  disabled={uploadingDoc === 'reference'}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingDoc === 'reference' ? 'Subiendo...' : 'Subir'}
                </Button>
              </div>
              {uploadedDocs.some(doc => doc.includes('reference')) && (
                <div className="mt-2 flex items-center text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Referencia subida
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Proceso de verificación */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Proceso de Verificación</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. Sube los documentos requeridos</li>
            <li>2. Nuestro equipo los revisará en 24-48 horas</li>
            <li>3. Te notificaremos el resultado por email</li>
            <li>4. Los usuarios verificados obtienen más visibilidad</li>
          </ul>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleDocumentUpload}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};

export default VerificationSection;
