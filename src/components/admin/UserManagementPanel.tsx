
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Users, UserCheck, UserX, Search, Eye, Home, Trophy, Calendar } from "lucide-react";
import AdminUserDetailsModal from "./AdminUserDetailsModal";
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
  is_active?: boolean;
  created_at: string;
  verification_status: string;
  total_properties: number;
  total_races: number;
  total_bookings: number;
  points_balance: number;
  average_rating: number;
}

const UserManagementPanel = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);

  const fetchUsers = async () => {
    try {
      // Obtener usuarios con estadísticas
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, email, first_name, last_name, created_at, verification_status,
          points_balance, average_rating
        `);

      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Error al cargar usuarios');
        setUsers([]);
        return;
      }

      // Obtener estadísticas adicionales para cada usuario
      const usersWithStats = await Promise.all(
        (data || []).map(async (user: any) => {
          // Contar propiedades
          const { count: propertiesCount } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', user.id);

          // Contar carreras
          const { count: racesCount } = await supabase
            .from('races')
            .select('*', { count: 'exact', head: true })
            .eq('host_id', user.id);

          // Contar reservas (como guest + como host)
          const { count: guestBookings } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('guest_id', user.id);

          const { count: hostBookings } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('host_id', user.id);

          return {
            ...user,
            is_active: user.is_active ?? true,
            total_properties: propertiesCount || 0,
            total_races: racesCount || 0,
            total_bookings: (guestBookings || 0) + (hostBookings || 0),
            points_balance: user.points_balance || 0,
            average_rating: user.average_rating || 0,
          };
        })
      );
      
      setUsers(usersWithStats);
      setFilteredUsers(usersWithStats);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error al cargar usuarios');
      setUsers([]);
      setFilteredUsers([]);
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

  // Filtrar usuarios por término de búsqueda
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-primary" />
              <span>Gestión de Usuarios</span>
              <Badge variant="secondary">{users.length} usuarios registrados</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      <CardContent>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Actividad</TableHead>
                <TableHead>Verificación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}` 
                        : 'Sin nombre'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.points_balance} puntos • ⭐ {user.average_rating.toFixed(1)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <Home className="h-3 w-3" />
                        <span>{user.total_properties}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Trophy className="h-3 w-3" />
                        <span>{user.total_races}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{user.total_bookings}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getVerificationBadge(user.verification_status)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(user.is_active ?? true)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(user.created_at), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUser({
                          id: user.id,
                          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
                        })}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      </Card>

      {/* Modal de detalles del usuario */}
      {selectedUser && (
        <AdminUserDetailsModal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          userId={selectedUser.id}
          userName={selectedUser.name}
        />
      )}
    </>
  );
};

export default UserManagementPanel;
