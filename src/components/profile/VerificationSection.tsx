
import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { Shield, Upload, CheckCircle, AlertCircle, FileText, Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const VerificationSection = () => {
  const { profile, uploadVerificationDoc, uploadAvatar } = useProfile();
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
    
    try {
      let result;
      if (selectedDocType === 'race_photo') {
        // Para la foto en carrera, usar uploadAvatar para sincronizar con foto de perfil
        result = await uploadAvatar(file);
        if (result) {
          // También agregar a verification_documents
          const currentDocs = profile?.verification_documents || [];
          const racePhotoDoc = `race_photo_${Date.now()}.jpg`;
          const newDocs = currentDocs.filter(doc => !doc.includes('race_photo')).concat([racePhotoDoc]);
          
          await supabase
            .from('profiles')
            .update({ verification_documents: newDocs })
            .eq('id', profile?.id);
        }
      } else {
        result = await uploadVerificationDoc(file, selectedDocType);
      }
      
      if (result) {
        // Enviar email de notificación al admin
        try {
          await supabase.functions.invoke('send-verification-email', {
            body: {
              user_id: profile?.id,
              user_name: `${profile?.first_name} ${profile?.last_name}`,
              documents_count: (profile?.verification_documents?.length || 0) + 1
            }
          });
          toast.success('Documento subido y admin notificado');
        } catch (error) {
          console.error('Error sending notification email:', error);
          toast.success('Documento subido correctamente');
        }
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Error al subir el documento');
    }
    
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
      case 'approved':
        return {
          badge: <Badge className="bg-green-100 text-green-800">Verificado</Badge>,
          icon: <CheckCircle className="h-6 w-6 text-green-600" />,
          message: "¡Tu perfil está verificado! Ahora puedes disfrutar de todas las funciones con total seguridad.",
          bgColor: "bg-green-50 border-green-200",
          textColor: "text-green-800"
        };
      case 'pending':
        return {
          badge: <Badge variant="secondary">Pendiente</Badge>,
          icon: <AlertCircle className="h-6 w-6 text-yellow-600" />,
          message: "Tu verificación está siendo revisada por nuestro equipo. Te notificaremos pronto del resultado.",
          bgColor: "bg-yellow-50 border-yellow-200",
          textColor: "text-yellow-800"
        };
      case 'rejected':
        return {
          badge: <Badge variant="destructive">Rechazado</Badge>,
          icon: <AlertCircle className="h-6 w-6 text-red-600" />,
          message: "Tu verificación fue rechazada. Por favor, sube documentos nuevos. La verificación es obligatoria para usar la plataforma.",
          bgColor: "bg-red-50 border-red-200",
          textColor: "text-red-800"
        };
      default:
        return {
          badge: <Badge variant="secondary">Sin verificar</Badge>,
          icon: <Shield className="h-6 w-6 text-gray-600" />,
          message: "La verificación de identidad es OBLIGATORIA para garantizar la seguridad y confianza en la comunidad.",
          bgColor: "bg-red-50 border-red-200",
          textColor: "text-red-800"
        };
    }
  };

  const verificationInfo = getVerificationStatus();
  const uploadedDocs = profile?.verification_documents || [];
  const hasRacePhoto = profile?.profile_image_url || uploadedDocs.some(doc => doc.includes('race_photo'));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {verificationInfo.icon}
            <span>Verificación de Identidad</span>
            {profile?.verification_status !== 'verified' && profile?.verification_status !== 'approved' && (
              <Badge variant="destructive" className="ml-2">OBLIGATORIO</Badge>
            )}
          </div>
          {verificationInfo.badge}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado actual */}
        <div className={`${verificationInfo.bgColor} border p-4 rounded-lg`}>
          <p className={`text-sm font-medium ${verificationInfo.textColor}`}>
            {verificationInfo.message}
          </p>
        </div>

        {/* Solo mostrar sección de subida si no está verificado */}
        {profile?.verification_status !== 'verified' && profile?.verification_status !== 'approved' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Documentos de Verificación Obligatorios</h4>
            
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

              {/* Selfie con ID */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Camera className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Selfie con tu rostro bien visible y Documento de Identidad</p>
                      <p className="text-sm text-gray-600">
                        Con buena iluminación. Puedes ocultar información no esencial como el número de serie o tu firma
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => triggerFileUpload('selfie_with_id')}
                    variant="outline"
                    size="sm"
                    disabled={uploadingDoc === 'selfie_with_id'}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingDoc === 'selfie_with_id' ? 'Subiendo...' : 'Subir'}
                  </Button>
                </div>
                
                {/* Imagen de ejemplo */}
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-2">Ejemplo de cómo hacer la foto:</p>
                  <img 
                    src="/lovable-uploads/1918d362-5172-4a88-afac-e81d1926b766.png" 
                    alt="Ejemplo de selfie con documento de identidad"
                    className="w-full max-w-md mx-auto rounded-lg border-2 border-blue-200"
                  />
                  <p className="text-xs text-blue-700 mt-2 text-center">
                    Asegúrate de que tu rostro y el documento sean claramente visibles
                  </p>
                </div>

                {uploadedDocs.some(doc => doc.includes('selfie_with_id')) && (
                  <div className="mt-2 flex items-center text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Selfie con ID subido
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
                      <p className="text-xs text-blue-700 mt-1">
                        Esta es la misma foto que tu foto de perfil. Si la cambias aquí, se actualizará también tu foto de perfil.
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
                {hasRacePhoto && (
                  <div className="mt-2 flex items-center text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Foto en carrera subida
                  </div>
                )}
                {profile?.profile_image_url && (
                  <div className="mt-3 flex items-center space-x-3">
                    <img 
                      src={profile.profile_image_url} 
                      alt="Vista previa de foto en carrera" 
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <p className="text-sm text-gray-600">Vista previa de tu foto en carrera actual</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Proceso de verificación */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Proceso de Verificación</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. Sube los documentos requeridos</li>
            <li>2. Nuestro equipo los revisará en 24-48 horas</li>
            <li>3. Te notificaremos el resultado</li>
            <li>4. Recibirás un email a runnershomeexchange@gmail.com con tu solicitud</li>
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
