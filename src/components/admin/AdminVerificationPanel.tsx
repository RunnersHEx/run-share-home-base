
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Shield, CheckCircle, XCircle, Clock, User, FileText, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VerificationRequest {
  id: string;
  user_id: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
  user_profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    verification_documents: string[] | null;
  };
}

interface DocumentWithUrl {
  path: string;
  url: string | null;
  error?: string;
}

const AdminVerificationPanel = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});
  const [showDocuments, setShowDocuments] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<DocumentWithUrl[]>([]);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  const fetchVerificationRequests = async () => {
    try {
      // Primero obtenemos las verification requests
      const { data: verificationData, error: verificationError } = await supabase
        .from('verification_requests')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (verificationError) throw verificationError;

      // Luego obtenemos los perfiles de los usuarios
      const userIds = verificationData?.map(req => req.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, verification_documents')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combinamos los datos
      const requestsWithProfiles = verificationData?.map(request => ({
        ...request,
        user_profile: profilesData?.find(profile => profile.id === request.user_id)
      })) || [];

      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      toast.error('Error al cargar solicitudes de verificación');
    } finally {
      setLoading(false);
    }
  };

  const updateVerificationStatus = async (requestId: string, status: 'approved' | 'rejected', notes?: string) => {
    setProcessingId(requestId);
    try {
      const { error } = await supabase
        .from('verification_requests')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes || null
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(
        status === 'approved' 
          ? 'Verificación aprobada exitosamente' 
          : 'Verificación rechazada'
      );
      
      await fetchVerificationRequests();
      setAdminNotes(prev => ({ ...prev, [requestId]: '' }));
    } catch (error) {
      console.error('Error updating verification status:', error);
      toast.error('Error al actualizar el estado de verificación');
    } finally {
      setProcessingId(null);
    }
  };

  const getSignedDocumentUrls = async (documents: string[]) => {
    setLoadingDocuments(true);
    const documentsWithUrls: DocumentWithUrl[] = [];
    
    for (const docPath of documents) {
      try {
        console.log('Getting signed URL for:', docPath);
        
        // Get signed URL for private bucket
        const { data, error } = await supabase.storage
          .from('verification-docs')
          .createSignedUrl(docPath, 3600); // 1 hour expiry

        if (error) {
          console.error('Error getting signed URL:', error);
          documentsWithUrls.push({
            path: docPath,
            url: null,
            error: error.message
          });
        } else {
          documentsWithUrls.push({
            path: docPath,
            url: data.signedUrl
          });
        }
      } catch (error) {
        console.error('Exception getting signed URL:', error);
        documentsWithUrls.push({
          path: docPath,
          url: null,
          error: 'Error desconocido'
        });
      }
    }
    
    setLoadingDocuments(false);
    return documentsWithUrls;
  };

  const openDocuments = async (documents: string[], userName: string) => {
    setSelectedUserName(userName);
    setShowDocuments(true);
    
    const documentsWithUrls = await getSignedDocumentUrls(documents);
    setSelectedDocuments(documentsWithUrls);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rechazado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  useEffect(() => {
    fetchVerificationRequests();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <span>Panel de Verificaciones de Admin</span>
          <Badge variant="secondary">{requests.filter(r => r.status === 'pending').length} pendientes</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay solicitudes de verificación
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Documentos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Enviado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {request.user_profile?.first_name || 'N/A'} {request.user_profile?.last_name || ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {request.user_profile?.email || 'No disponible'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {request.user_profile?.verification_documents?.length || 0} documentos
                          </span>
                        </div>
                        {request.user_profile?.verification_documents && request.user_profile.verification_documents.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDocuments(
                              request.user_profile?.verification_documents || [],
                              `${request.user_profile?.first_name || 'N/A'} ${request.user_profile?.last_name || ''}`
                            )}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(request.submitted_at), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' ? (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Notas del admin (opcional)"
                            value={adminNotes[request.id] || ''}
                            onChange={(e) => setAdminNotes(prev => ({ 
                              ...prev, 
                              [request.id]: e.target.value 
                            }))}
                            className="h-20 text-xs"
                          />
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => updateVerificationStatus(
                                request.id, 
                                'approved', 
                                adminNotes[request.id]
                              )}
                              disabled={processingId === request.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateVerificationStatus(
                                request.id, 
                                'rejected', 
                                adminNotes[request.id]
                              )}
                              disabled={processingId === request.id}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {request.reviewed_at && (
                            <div>
                              Revisado {formatDistanceToNow(new Date(request.reviewed_at), { 
                                addSuffix: true, 
                                locale: es 
                              })}
                            </div>
                          )}
                          {request.admin_notes && (
                            <div className="mt-1 text-xs bg-gray-50 p-2 rounded">
                              <strong>Notas:</strong> {request.admin_notes}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Modal para ver documentos */}
      <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Documentos de Verificación - {selectedUserName}</DialogTitle>
          </DialogHeader>
          
          {loadingDocuments ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Cargando documentos...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDocuments.map((doc, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Documento {index + 1}</h4>
                    <div className="text-xs text-gray-500">{doc.path}</div>
                  </div>
                  
                  {doc.error ? (
                    <div className="bg-red-50 border border-red-200 rounded p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-red-400" />
                      <p className="text-red-600 font-medium">Error al cargar documento</p>
                      <p className="text-sm text-red-500">{doc.error}</p>
                    </div>
                  ) : doc.url ? (
                    <div className="bg-gray-50 rounded p-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Vista previa del documento:</span>
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Abrir en nueva pestaña
                        </a>
                      </div>
                      <img 
                        src={doc.url} 
                        alt={`Documento ${index + 1}`}
                        className="max-w-full h-auto rounded shadow-sm max-h-96 object-contain mx-auto"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentNode as HTMLElement;
                          const errorDiv = document.createElement('div');
                          errorDiv.className = 'flex items-center justify-center h-32 bg-gray-100 rounded';
                          errorDiv.innerHTML = `
                            <div class="text-center text-gray-500">
                              <div class="mb-2">📄</div>
                              <p>Formato no compatible para vista previa</p>
                              <p class="text-xs">Haz clic en "Abrir en nueva pestaña"</p>
                            </div>
                          `;
                          parent.appendChild(errorDiv);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-gray-50 border rounded p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600">Cargando documento...</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminVerificationPanel;
