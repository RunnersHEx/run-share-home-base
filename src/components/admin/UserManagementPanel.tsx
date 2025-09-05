import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  Eye, 
  Home, 
  Trophy, 
  Calendar,
  MessageSquare,
  Trash2,
  AlertTriangle
} from "lucide-react";
import AdminUserDetailsModal from "./AdminUserDetailsModal";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { NotificationService } from "@/services/notificationService";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  created_at: string;
  verification_status: string;
  total_properties: number;
  total_races: number;
  total_bookings: number;
  points_balance: number;
  average_rating: number;
}

interface DeactivationModal {
  isOpen: boolean;
  user: UserProfile | null;
}

interface DeletionModal {
  isOpen: boolean;
  user: UserProfile | null;
}

const UserManagementPanel = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  
  // Modals state
  const [deactivationModal, setDeactivationModal] = useState<DeactivationModal>({ isOpen: false, user: null });
  const [deletionModal, setDeletionModal] = useState<DeletionModal>({ isOpen: false, user: null });
  const [deactivationReason, setDeactivationReason] = useState("");
  const [deletionReason, setDeletionReason] = useState("");

  const fetchUsers = async () => {
    try {
      // Fetch users with all necessary data including is_active
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, email, first_name, last_name, created_at, verification_status,
          points_balance, average_rating, is_active
        `);

      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Error al cargar usuarios');
        setUsers([]);
        return;
      }

      // Get additional statistics for each user
      const usersWithStats = await Promise.all(
        (data || []).map(async (user: any) => {
          // Count properties
          const { count: propertiesCount } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', user.id);

          // Count races
          const { count: racesCount } = await supabase
            .from('races')
            .select('*', { count: 'exact', head: true })
            .eq('host_id', user.id);

          // Count bookings (as guest + as host)
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

  const handleDeactivationSubmit = async () => {
    if (!deactivationModal.user || !currentUser?.id) return;
    
    const user = deactivationModal.user;
    setProcessingId(user.id);
    
    try {
      const { data, error } = await supabase.rpc('admin_toggle_user_status', {
        target_user_id: user.id,
        admin_user_id: currentUser.id,
        deactivation_reason: deactivationReason.trim() || null
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Error updating user status');
      }

      toast.success(
        user.is_active
          ? `Usuario ${data.user_name} desactivado exitosamente`
          : `Usuario ${data.user_name} activado exitosamente`
      );

      // Send notification to the user
      try {
        const adminName = `${currentUser?.user_metadata?.first_name || ''} ${currentUser?.user_metadata?.last_name || ''}`.trim() || 'Administrador';
        
        if (user.is_active) {
          // User was deactivated
          await NotificationService.notifyAccountDeactivated(
            user.id,
            deactivationReason.trim() || 'Sin motivo especificado',
            adminName
          );
        } else {
          // User was activated
          await NotificationService.notifyAccountActivated(user.id, adminName);
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't fail the entire operation if notification fails
      }

      // Close modal and reset - using callback to ensure proper cleanup
      closeDeactivationModal();
      
      // Refresh users
      await fetchUsers();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast.error(error.message || 'Error al actualizar el estado del usuario');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletionModal.user || !currentUser?.id) return;
    
    const user = deletionModal.user;
    setProcessingId(user.id);
    
    try {
      const { data, error } = await supabase.rpc('admin_delete_user_complete', {
        target_user_id: user.id,
        admin_user_id: currentUser.id,
        deletion_reason: deletionReason.trim() || null
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Error deleting user');
      }

      toast.success(`Usuario ${data.deleted_user_name} eliminado exitosamente`);

      // Close modal and reset - using callback to ensure proper cleanup
      closeDeletionModal();
      
      // Refresh users
      await fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Error al eliminar usuario');
    } finally {
      setProcessingId(null);
    }
  };

  const openDeactivationModal = useCallback((user: UserProfile) => {
    setDeactivationModal({ isOpen: true, user });
    setDeactivationReason("");
  }, []);

  const openDeletionModal = useCallback((user: UserProfile) => {
    setDeletionModal({ isOpen: true, user });
    setDeletionReason("");
  }, []);

  // Safe modal close handlers with proper cleanup
  const closeDeactivationModal = useCallback(() => {
    setProcessingId(null); // Clear processing state first
    setDeactivationReason(""); // Clear form data
    setDeactivationModal({ isOpen: false, user: null }); // Close modal
  }, []);

  const closeDeletionModal = useCallback(() => {
    setProcessingId(null); // Clear processing state first
    setDeletionReason(""); // Clear form data
    setDeletionModal({ isOpen: false, user: null }); // Close modal
  }, []);

  // Safe modal change handlers
  const handleDeactivationModalChange = useCallback((open: boolean) => {
    if (!open && !processingId) {
      closeDeactivationModal();
    }
  }, [processingId, closeDeactivationModal]);

  const handleDeletionModalChange = useCallback((open: boolean) => {
    if (!open && !processingId) {
      closeDeletionModal();
    }
  }, [processingId, closeDeletionModal]);

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

  // Filter users by search term
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
                      {getStatusBadge(user.is_active)}
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
                          onClick={() => openDeactivationModal(user)}
                          disabled={processingId === user.id}
                          className={!user.is_active ? "bg-green-600 hover:bg-green-700" : ""}
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

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDeletionModal(user)}
                          disabled={processingId === user.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Eliminar
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

      {/* User Details Modal */}
      {selectedUser && (
        <AdminUserDetailsModal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          userId={selectedUser.id}
          userName={selectedUser.name}
        />
      )}

      {/* Deactivation/Activation Modal */}
      <Dialog 
        open={deactivationModal.isOpen} 
        onOpenChange={handleDeactivationModalChange}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>
                {deactivationModal.user?.is_active ? 'Desactivar Usuario' : 'Activar Usuario'}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-medium">
                {deactivationModal.user?.first_name && deactivationModal.user?.last_name
                  ? `${deactivationModal.user.first_name} ${deactivationModal.user.last_name}`
                  : deactivationModal.user?.email}
              </p>
              <p className="text-sm text-muted-foreground">{deactivationModal.user?.email}</p>
            </div>

            {deactivationModal.user?.is_active && (
              <div className="space-y-2">
                <Label htmlFor="deactivation-reason">
                  Motivo de desactivación <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="deactivation-reason"
                  placeholder="Explica por qué se desactiva esta cuenta. Este mensaje será visible para el usuario."
                  value={deactivationReason}
                  onChange={(e) => setDeactivationReason(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  required
                  disabled={!!processingId}
                />
                <p className="text-xs text-muted-foreground">
                  {deactivationReason.length}/2000 caracteres
                </p>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  {deactivationModal.user?.is_active ? (
                    <div>
                      <p className="font-medium text-amber-800">Al desactivar este usuario:</p>
                      <ul className="mt-1 list-disc list-inside text-amber-700 space-y-1">
                        <li>No podrá crear nuevas propiedades ni carreras</li>
                        <li>No podrá aplicar a carreras</li>
                        <li>Solo podrá acceder a su perfil y mensajes del administrador</li>
                        <li>Recibirá una notificación con el motivo</li>
                      </ul>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-amber-800">Al activar este usuario:</p>
                      <ul className="mt-1 list-disc list-inside text-amber-700 space-y-1">
                        <li>Recuperará acceso completo a la plataforma</li>
                        <li>Podrá crear propiedades y carreras nuevamente</li>
                        <li>Recibirá una notificación de activación</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeDeactivationModal}
              disabled={!!processingId}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDeactivationSubmit}
              disabled={
                !!processingId ||
                (deactivationModal.user?.is_active && !deactivationReason.trim())
              }
              variant={deactivationModal.user?.is_active ? "destructive" : "default"}
              className={!deactivationModal.user?.is_active ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {processingId === deactivationModal.user?.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                deactivationModal.user?.is_active ? (
                  <UserX className="h-4 w-4 mr-2" />
                ) : (
                  <UserCheck className="h-4 w-4 mr-2" />
                )
              )}
              {deactivationModal.user?.is_active ? 'Desactivar Usuario' : 'Activar Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deletion Confirmation Modal */}
      <AlertDialog 
        open={deletionModal.isOpen} 
        onOpenChange={handleDeletionModalChange}
      >
        <AlertDialogContent className="sm:max-w-[500px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              <span>Eliminar Usuario Permanentemente</span>
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium">
                    {deletionModal.user?.first_name && deletionModal.user?.last_name
                      ? `${deletionModal.user.first_name} ${deletionModal.user.last_name}`
                      : deletionModal.user?.email}
                  </p>
                  <p className="text-sm text-muted-foreground">{deletionModal.user?.email}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deletion-reason">Motivo de eliminación</Label>
                  <Textarea
                    id="deletion-reason"
                    placeholder="Explica por qué se elimina esta cuenta (opcional, para registros internos)."
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    rows={2}
                    maxLength={500}
                    disabled={!!processingId}
                  />
                  <p className="text-xs text-muted-foreground">
                    {deletionReason.length}/500 caracteres
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-red-800">⚠️ ADVERTENCIA: Esta acción es IRREVERSIBLE</p>
                      <ul className="mt-1 list-disc list-inside text-red-700 space-y-1">
                        <li>Se eliminarán todos los datos del usuario</li>
                        <li>Se eliminarán sus propiedades y carreras</li>
                        <li>Se eliminarán todos sus mensajes y reservas</li>
                        <li>Esta acción NO se puede deshacer</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              disabled={!!processingId}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={!!processingId}
              className="bg-red-600 hover:bg-red-700"
            >
              {processingId === deletionModal.user?.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Eliminar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserManagementPanel;