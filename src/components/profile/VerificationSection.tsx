
import React, { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Upload, CheckCircle, AlertCircle, FileText, Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { NotificationService } from "@/services/notificationService";
import { PointsManagementService } from "@/services/pointsManagementService";

const VerificationSection = () => {
  const { user } = useAuth();
  const { profile, loading, progress, uploadVerificationDoc, uploadAvatar, refetchProfile, refreshAuthProfile, updateProfile } = useProfile();
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>('');

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedDocType) return;

    // Validate file format
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!allowedTypes.includes(file.type) && !hasValidExtension) {
      toast.error('Solo se permiten archivos JPG, JPEG o PNG');
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedDocType('');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo debe ser menor a 10MB');
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedDocType('');
      return;
    }

    console.log(`Starting ${selectedDocType} upload`);
    setUploadingDoc(selectedDocType);
    
    try {
      const result = await uploadVerificationDoc(file, selectedDocType);
      
      if (result) {
        console.log(`${selectedDocType} uploaded successfully:`, result);
        
        // Wait for database to be consistent before proceeding
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Force fresh data fetch
        await refetchProfile();
        
        // Refresh AuthContext profile to ensure sync
        if (refreshAuthProfile) {
          await refreshAuthProfile();
        }
        
        // Wait a bit more for state to propagate
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Get the LATEST verification documents from a fresh database query
        const userId = profile?.id || user?.id;
        if (!userId) {
          console.error('No valid user ID available for verification document check');
          throw new Error('Usuario no identificado');
        }
        
        const { data: freshProfile } = await supabase
          .from('profiles')
          .select('verification_documents')
          .eq('id', userId)
          .single();
        
        const latestDocs = freshProfile?.verification_documents || [];
        console.log('Latest documents from DB:', latestDocs);
        
        const hasBothDocs = latestDocs.some(doc => doc.includes('id_document')) && 
                           latestDocs.some(doc => doc.includes('selfie_with_id'));
        
        console.log('Document check result:', {
          hasIdDoc: latestDocs.some(doc => doc.includes('id_document')),
          hasSelfie: latestDocs.some(doc => doc.includes('selfie_with_id')),
          hasBothDocs,
          totalDocs: latestDocs.length
        });
        
        // Success feedback
        toast.success(`${selectedDocType === 'id_document' ? 'Documento de identidad' : 'Selfie con ID'} subido correctamente`);
        
        // If both documents are uploaded, handle completion
        if (hasBothDocs) {
          // Only award points and send notifications when BOTH documents are complete
          // Check if user has already received verification points to avoid duplicates
          try {
            const pointsHistory = await PointsManagementService.getUserPointsHistory(profile?.id || '', 100);
            const hasVerificationPoints = pointsHistory.some(transaction => 
              transaction.description.includes('Identity verification completed')
            );
            
            if (!hasVerificationPoints) {
              // Award 25 points for completing identity verification (both documents)
              await PointsManagementService.awardVerificationPoints(profile?.id || '');
              toast.success('¡Ambos documentos subidos! +25 puntos por verificación completa', {
                duration: 4000
              });
            } else {
              toast.success('¡Ambos documentos subidos correctamente!', {
                duration: 3000
              });
            }
          } catch (error) {
            console.error('Error awarding verification points:', error);
            toast.success('¡Ambos documentos subidos correctamente!', {
              duration: 3000
            });
          }
          
          // Send admin notifications ONLY when both documents are uploaded
          try {
            await supabase.functions.invoke('send-verification-email', {
              body: {
                user_id: profile?.id,
                user_name: `${profile?.first_name} ${profile?.last_name}`,
                user_email: profile?.email || 'Sin email',
                documents_count: latestDocs.length,
                both_documents_complete: true
              }
            });
            
            await NotificationService.notifyVerificationDocumentsSubmitted({
              id: profile?.id,
              first_name: profile?.first_name,
              last_name: profile?.last_name,
              email: profile?.email,
              verification_status: 'pending',
              verification_documents: latestDocs
            });
            
            console.log('Admin notifications sent for BOTH documents completed');
          } catch (error) {
            console.error('Error sending admin notifications:', error);
          }
          
          // Ultra-fast refresh to show the green completion screen
          setTimeout(() => {
            console.log('Both documents complete - refreshing page to show green screen');
            window.location.reload();
          }, 100); // Ultra-fast and dynamic - 0.5 seconds
        }
        
        // Dispatch status change event
        window.dispatchEvent(new CustomEvent('verificationStatusChanged', {
          detail: { 
            documentsUploaded: true,
            bothDocumentsUploaded: hasBothDocs,
            docType: selectedDocType
          }
        }));
        
      } else {
        throw new Error('Upload failed - no result returned');
      }
    } catch (error) {
      console.error(`Error uploading ${selectedDocType}:`, error);
      toast.error(`Error al subir ${selectedDocType === 'id_document' ? 'documento de identidad' : 'selfie con ID'}`);
    } finally {
      setUploadingDoc(null);
      setSelectedDocType('');
      
      // CRITICAL: Clear the file input to prevent stuck state
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileUpload = (docType: string) => {
    setSelectedDocType(docType);
    fileInputRef.current?.click();
  };

  const getVerificationStatus = () => {
    const status = profile?.verification_status || 'pending';
    const uploadedDocs = profile?.verification_documents || [];
    const hasRequiredDocs = uploadedDocs.some(doc => doc.includes('id_document')) && 
                           uploadedDocs.some(doc => doc.includes('selfie_with_id'));
    
    // If user has uploaded required documents, they can access platform
    if (hasRequiredDocs) {
      if (status === 'verified' || status === 'approved') {
        return {
          badge: <Badge className="bg-green-100 text-green-800">Verificado por Admin</Badge>,
          icon: <CheckCircle className="h-6 w-6 text-green-600" />,
          message: "¡Tu perfil está verificado por nuestro equipo! Tienes acceso completo a todas las funciones.",
          bgColor: "bg-green-50 border-green-200",
          textColor: "text-green-800"
        };
      } else {
        return {
          badge: <Badge className="bg-blue-100 text-blue-800">Documentos Subidos - Acceso Permitido</Badge>,
          icon: <CheckCircle className="h-6 w-6 text-blue-600" />,
          message: "¡Has subido los documentos requeridos! Ya puedes usar la plataforma mientras nuestro equipo los revisa.",
          bgColor: "bg-blue-50 border-blue-200",
          textColor: "text-blue-800"
        };
      }
    }
    
    // User hasn't uploaded required documents yet
    switch (status) {
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
          badge: <Badge variant="secondary">Documentos Requeridos</Badge>,
          icon: <Shield className="h-6 w-6 text-gray-600" />,
          message: "Debes subir los documentos requeridos para acceder a la plataforma. Una vez subidos, podrás usar todas las funciones inmediatamente.",
          bgColor: "bg-red-50 border-red-200",
          textColor: "text-red-800"
        };
    }
  };

  const verificationInfo = getVerificationStatus();
  const uploadedDocs = profile?.verification_documents || [];
  const hasRequiredDocs = uploadedDocs.some(doc => doc.includes('id_document')) && 
                         uploadedDocs.some(doc => doc.includes('selfie_with_id'));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {verificationInfo.icon}
            <span>Verificación de Identidad</span>
            {!hasRequiredDocs && (
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

        {/* Solo mostrar sección de subida si no tiene los documentos requeridos */}
        {!hasRequiredDocs ? (
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
                      <p className="text-xs text-blue-600 font-medium mt-1">
                        Solo se permiten archivos JPG, JPEG o PNG
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
                      <p className="text-xs text-blue-600 font-medium mt-1">
                        Solo se permiten archivos JPG, JPEG o PNG
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
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border-2 border-green-200 p-6 rounded-lg text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h4 className="font-semibold text-green-800 text-lg mb-2">
                ¡Documentos Subidos Exitosamente!
              </h4>
              <p className="text-green-700 mb-4">
                Has completado la verificación de identidad. Ya tienes acceso completo a la plataforma.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-2 bg-white p-3 rounded-lg border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Documento de Identidad</span>
                </div>
                <div className="flex items-center justify-center space-x-2 bg-white p-3 rounded-lg border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Selfie con ID</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Proceso de verificación */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Proceso de Verificación</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. Sube los documentos requeridos (ID y selfie con ID)</li>
            <li>2. ✅ <strong>Acceso inmediato</strong> a la plataforma una vez subidos</li>
            <li>3. Nuestro equipo los revisará en 24-48 horas</li>
            <li>4. Te notificaremos el resultado por email</li>
          </ul>
          <div className="mt-3 p-2 bg-green-100 rounded border-l-4 border-green-400">
            <p className="text-sm text-green-800">
              <strong>¡Importante!</strong> Una vez subas los documentos requeridos, podrás usar la plataforma inmediatamente sin esperar la revisión del admin.
            </p>
          </div>
        </div>

        {/* Input para documentos generales */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          onChange={handleDocumentUpload}
          className="hidden"
          title="Solo se permiten archivos JPG, JPEG o PNG"
        />
      </CardContent>
    </Card>
  );
};

export default VerificationSection;
