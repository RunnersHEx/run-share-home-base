
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Shield, CheckCircle, XCircle, Clock, User, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface VerificationRequest {
  id: string;
  user_id: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    verification_documents: string[];
  };
}

const AdminVerificationPanel = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

  const fetchVerificationRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            email,
            verification_documents
          )
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
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
                          {request.profiles.first_name} {request.profiles.last_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {request.profiles.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {request.profiles.verification_documents?.length || 0} documentos
                        </span>
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
    </Card>
  );
};

export default AdminVerificationPanel;
