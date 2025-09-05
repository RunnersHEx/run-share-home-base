import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Shield, CheckCircle, XCircle, Clock, User, FileText, Eye, AlertTriangle, RefreshCw } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { AdminStorageService } from "@/services/adminStorageService";
import { AdminVerificationService } from "@/services/adminVerificationService";

interface VerificationRequest {
  id: string | null;
  user_id: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
  user_profile: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    verification_documents: string[] | null;
    verification_status: string;
    created_at: string;
  };
}

interface DocumentWithUrl {
  path: string;
  url: string | null;
  error?: string;
}

const AdminVerificationPanel = () => {
  const { user: currentUser } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});
  const [showDocuments, setShowDocuments] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<DocumentWithUrl[]>([]);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [storageSetupNeeded, setStorageSetupNeeded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVerificationRequests = async () => {
    setRefreshing(true);
    try {
      // Get ALL profiles that have uploaded verification documents (except already verified ones)
      const { data: profilesWithDocs, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, verification_documents, verification_status, created_at')
        .not('verification_documents', 'is', null)
        .neq('verification_documents', '{}')
        .not('verification_status', 'in', '("verified","approved","confirmed","accepted","active")') // Exclude all verified statuses
        .order('created_at', { ascending: false });

      if (profilesError) {
        throw profilesError;
      }

      // Filter out profiles with empty or null verification_documents arrays, but keep all non-verified statuses
      const validProfiles = (profilesWithDocs || []).filter(profile => 
        profile.verification_documents && 
        Array.isArray(profile.verification_documents) && 
        profile.verification_documents.length > 0 &&
        !['verified', 'approved', 'confirmed', 'accepted', 'active'].includes(profile.verification_status) // Exclude all verified statuses
      );

      if (validProfiles.length === 0) {
        setRequests([]);
        return;
      }

      // Try to get verification requests for these users, but don't fail if RLS blocks access
      let verificationRequests: any[] = [];
      try {
        const userIds = validProfiles.map(profile => profile.id);
        const { data: requestsData, error: requestsError } = await supabase
          .from('verification_requests')
          .select('*')
          .in('user_id', userIds)
          .neq('status', 'verified') // Exclude verified requests
          .neq('status', 'approved') // Exclude approved requests
          .order('submitted_at', { ascending: false });

        if (!requestsError && requestsData) {
          verificationRequests = requestsData;
        }
      } catch (error) {
        console.warn('Could not fetch verification requests directly - using profile data only');
        // Continue without verification requests data
      }

      // Combine profiles with their verification requests (if any)
      const combinedData = validProfiles.map(profile => {
        const verificationRequest = verificationRequests?.find(req => req.user_id === profile.id);
        
        // Determine the actual status (prioritize verification_request status over profile status)
        const actualStatus = verificationRequest?.status || profile.verification_status || 'pending';
        
        return {
          id: verificationRequest?.id || null,
          user_id: profile.id,
          status: actualStatus,
          submitted_at: verificationRequest?.submitted_at || profile.created_at,
          reviewed_at: verificationRequest?.reviewed_at || null,
          admin_notes: verificationRequest?.admin_notes || null,
          user_profile: {
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email,
            verification_documents: profile.verification_documents,
            verification_status: profile.verification_status,
            created_at: profile.created_at
          }
        };
      });

      // Filter out any verified users (final safety check)
      const verifiedStatusesFinal = ['approved', 'verified', 'confirmed', 'accepted', 'active'];
      const nonVerified = combinedData.filter(item => 
        !verifiedStatusesFinal.includes(item.status)
      );

      // Sort by latest submission/creation first
      nonVerified.sort((a, b) => {
        const dateA = new Date(a.submitted_at);
        const dateB = new Date(b.submitted_at);
        return dateB.getTime() - dateA.getTime();
      });

      console.log('Fetched verification requests:', {
        totalProfilesWithDocs: profilesWithDocs?.length || 0,
        validProfiles: validProfiles.length,
        finalList: nonVerified.length,
        statuses: nonVerified.map(r => ({ id: r.user_id, status: r.status }))
      });

      setRequests(nonVerified);
    } catch (error) {
      console.error('Error fetching verification data:', error);
      toast.error('Error al cargar solicitudes de verificación');
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateVerificationStatus = async (userId: string, status: 'approved' | 'rejected', notes?: string) => {
    if (!currentUser?.id) {
      toast.error('No se pudo identificar el administrador');
      return;
    }

    setProcessingId(userId);
    
    try {
      console.log('Starting verification process with AdminVerificationService:', { userId, status, adminId: currentUser.id, notes });
      
      // Use the AdminVerificationService that handles service role and RLS bypass
      const result = await AdminVerificationService.updateVerificationStatus(
        userId,
        status,
        currentUser.id,
        notes
      );

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido al actualizar verificación');
      }

      console.log('Verification updated successfully using AdminVerificationService');
      
      toast.success(
        status === 'approved' 
          ? `Verificación de ${result.userName} aprobada exitosamente` 
          : `Verificación de ${result.userName} rechazada`
      );
      
      // Remove the user from the current list immediately
      setRequests(prev => {
        const filteredRequests = prev.filter(req => req.user_id !== userId);
        console.log('Removed user from local state. Remaining users:', filteredRequests.length);
        return filteredRequests;
      });
      
      // Clear admin notes for this user
      setAdminNotes(prev => ({ ...prev, [userId]: '' }));
      
      // Refresh the list if user was rejected
      if (status === 'rejected') {
        console.log('User was rejected, refreshing list to show updated status');
        setTimeout(() => {
          fetchVerificationRequests();
        }, 500);
      }
    } catch (error: any) {
      console.error('Error updating verification status:', error);
      toast.error(error.message || 'Error al actualizar el estado de verificación');
    } finally {
      setProcessingId(null);
    }
  };

  const getSignedDocumentUrls = async (documents: string[]) => {
    setLoadingDocuments(true);
    
    try {
      // Use AdminStorageService for better access handling
      const documentsWithUrls = await AdminStorageService.getVerificationDocumentUrls(documents);
      
      // Check if any documents failed due to permissions
      const hasPermissionErrors = documentsWithUrls.some(doc => 
        doc.error?.includes('permisos') || doc.error?.includes('Permisos') || doc.error?.includes('VITE_SUPABASE_SERVICE_ROLE_KEY')
      );
      
      if (hasPermissionErrors) {
        setStorageSetupNeeded(true);
      }
      
      setLoadingDocuments(false);
      return documentsWithUrls;
    } catch (error) {
      setLoadingDocuments(false);
      toast.error('Error al cargar documentos');
      return documents.map(path => ({
        path,
        url: null,
        error: 'Error inesperado al cargar documento'
      }));
    }
  };

  const openDocuments = async (documents: string[], userName: string) => {
    setSelectedUserName(userName);
    setShowDocuments(true);
    
    const documentsWithUrls = await getSignedDocumentUrls(documents);
    setSelectedDocuments(documentsWithUrls);
  };

  const getStatusBadge = (status: string) => {
    const approvedStatuses = ['approved', 'verified', 'confirmed', 'accepted', 'active'];
    
    switch (status) {
      case 'pending':
      case null:
      case undefined:
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rechazado</Badge>;
      case 'verified':
      case 'approved':
      case 'confirmed':
      case 'accepted':
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verificado</Badge>;
      default:
        return <Badge variant="secondary">Sin verificar</Badge>;
    }
  };

  const getUserDisplayName = (userProfile: any) => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    }
    return userProfile?.email || 'Usuario desconocido';
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
        <CardTitle className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span>Panel de Verificación de Documentos</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchVerificationRequests}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </CardTitle>
        
        {/* Service Role Setup Instructions */}
        {(storageSetupNeeded || !AdminVerificationService.isServiceRoleAvailable()) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">🔧 Configuración de Permisos de Administrador Requerida</p>
                <p className="text-amber-700 mt-1">
                  Para funciones completas de administrador (verificaciones y documentos), agrega esta línea a tu archivo <code className="bg-amber-100 px-2 py-1 rounded text-xs">.env.local</code>:
                </p>
                <div className="bg-amber-100 p-2 rounded mt-2 text-xs font-mono">
                  VITE_SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aquí
                </div>
                <p className="text-amber-600 mt-2 text-xs">
                  📍 Encuentra tu Service Role Key en: <br/>
                  Supabase Dashboard → Settings → API → service_role key
                </p>
                <p className="text-amber-600 mt-1 text-xs">
                  ♾️ Reinicia tu servidor de desarrollo después de agregar la clave
                </p>
                <p className="text-amber-600 mt-1 text-xs">
                  ⚠️ Sin esta clave, las verificaciones fallarán por restricciones de seguridad (RLS)
                </p>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No hay usuarios pendientes de verificación</p>
            <p className="text-sm">Los usuarios verificados se ocultan automáticamente de esta lista</p>
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
                  <TableRow key={request.user_id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {getUserDisplayName(request.user_profile)}
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
                              getUserDisplayName(request.user_profile)
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
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Notas del admin (opcional)"
                          value={adminNotes[request.user_id] || ''}
                          onChange={(e) => setAdminNotes(prev => ({ 
                            ...prev, 
                            [request.user_id]: e.target.value 
                          }))}
                          className="h-20 text-xs"
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => updateVerificationStatus(
                              request.user_id, 
                              'approved', 
                              adminNotes[request.user_id]
                            )}
                            disabled={processingId === request.user_id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateVerificationStatus(
                              request.user_id, 
                              'rejected', 
                              adminNotes[request.user_id]
                            )}
                            disabled={processingId === request.user_id}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                        {request.reviewed_at && (
                          <div className="text-xs text-gray-500">
                            Revisado {formatDistanceToNow(new Date(request.reviewed_at), { 
                              addSuffix: true, 
                              locale: es 
                            })}
                            {request.admin_notes && (
                              <div className="mt-1 bg-gray-50 p-2 rounded">
                                <strong>Notas:</strong> {request.admin_notes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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
              {selectedDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron documentos válidos
                </div>
              ) : (
                selectedDocuments.map((doc, index) => (
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
                        {doc.error.includes('permisos') && (
                          <p className="text-xs text-red-400 mt-2">
                            💡 Configura VITE_SUPABASE_SERVICE_ROLE_KEY en tu .env.local
                          </p>
                        )}
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
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminVerificationPanel;