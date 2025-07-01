
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Users, UserCheck, UserX } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_active?: boolean; // Make optional to handle missing column
  created_at: string;
  verification_status: string;
}

const UserManagementPanel = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      // Try to select with is_active, but handle if column doesn't exist
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, created_at, verification_status');

      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Error al cargar usuarios');
        setUsers([]);
        return;
      }
      
      // Map data and add default is_active if missing
      const validUsers = (data || []).map((user: any) => ({
        ...user,
        is_active: user.is_active ?? true // Default to true if column doesn't exist
      }));
      
      setUsers(validUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error al cargar usuarios');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setProcessingId(userId);
    try {
      // Try to update, but handle if column doesn't exist
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus } as any)
        .eq('id', userId);

      if (error) {
        // If column doesn't exist, show appropriate message
        if (error.message?.includes('column "is_active" does not exist')) {
          toast.error('La funcionalidad está pendiente de migración de base de datos');
        } else {
          throw error;
        }
      } else {
        toast.success(
          !currentStatus 
            ? 'Usuario activado exitosamente' 
            : 'Usuario desactivado exitosamente'
        );
        
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Error al actualizar el estado del usuario');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge className="bg-green-100 text-green-800"><UserCheck className="h-3 w-3 mr-1" />Activo</Badge>
      : <Badge variant="destructive"><UserX className="h-3 w-3 mr-1" />Inactivo</Badge>;
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Verificado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  useEffect(() => {
    fetchUsers();
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
          <Users className="h-6 w-6 text-blue-600" />
          <span>Gestión de Usuarios</span>
          <Badge variant="secondary">{users.length} usuarios registrados</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay usuarios registrados
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Verificación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}` 
                        : 'Sin nombre'}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    {getVerificationBadge(user.verification_status)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(user.is_active ?? true)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(user.created_at), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={user.is_active ? "destructive" : "default"}
                      onClick={() => toggleUserStatus(user.id, user.is_active ?? true)}
                      disabled={processingId === user.id}
                      className={!(user.is_active ?? true) ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {user.is_active ? (
                        <>
                          <UserX className="h-3 w-3 mr-1" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3 w-3 mr-1" />
                          Activar
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagementPanel;
