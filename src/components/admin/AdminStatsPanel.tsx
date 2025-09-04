import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AdminService } from "@/services/adminService";
import { 
  Users, 
  Home, 
  Trophy, 
  Calendar, 
  TrendingUp, 
  Shield,
  Activity,
  Star,
  UserPlus,
  RotateCcw,
  UserX,
  RefreshCw,
  AlertTriangle,
  Eye
} from "lucide-react";

interface SystemStats {
  totalUsers: number;
  verifiedUsers: number;
  pendingVerifications: number;
  totalProperties: number;
  activeProperties: number;
  totalRaces: number;
  activeRaces: number;
  totalBookings: number;
  completedBookings: number;
  totalPointsInSystem: number;
  avgUserRating: number;
  newUsersThisMonth: number;
}

interface NewUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  verification_status: string | null;
  verification_documents: string[] | null;
  is_host: boolean;
  is_guest: boolean;
}

interface SubscriptionRenewal {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  plan_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  updated_at: string;
}

interface AccountDeletion {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  deletion_type: string;
  deletion_reason: string;
  deleted_at: string;
  total_bookings: number;
  total_points_at_deletion: number;
}

interface DeletionStats {
  total_deletions: number;
  self_deletions: number;
  admin_deletions: number;
  this_month: number;
  this_week: number;
  today: number;
}

const AdminStatsPanel = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newUsers, setNewUsers] = useState<NewUser[]>([]);
  const [renewals, setRenewals] = useState<SubscriptionRenewal[]>([]);
  const [deletions, setDeletions] = useState<AccountDeletion[]>([]);
  const [deletionStats, setDeletionStats] = useState<DeletionStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchSystemStats = async () => {
    try {
      // Total usuarios y verificaciones - get verification_documents to distinguish status
      const { data: profiles } = await supabase
        .from('profiles')
        .select('verification_status, verification_documents, points_balance, average_rating, created_at');

      // Propiedades
      const { data: properties } = await supabase
        .from('properties')
        .select('is_active');

      // Carreras
      const { data: races } = await supabase
        .from('races')
        .select('is_active');

      // Reservas
      const { data: bookings } = await supabase
        .from('bookings')
        .select('status, points_cost');

      // Calcular estadísticas - handle null/undefined verification_status values
      const totalUsers = profiles?.length || 0;
      const verifiedUsers = profiles?.filter(p => {
        const status = p.verification_status?.toLowerCase()?.trim();
        return status === 'verified' || status === 'approved';
      }).length || 0;
      
      // Count users who have submitted documents but are still pending review
      const pendingVerifications = profiles?.filter(p => {
        const status = p.verification_status?.toLowerCase()?.trim();
        const hasDocuments = p.verification_documents && Array.isArray(p.verification_documents) && p.verification_documents.length > 0;
        return status === 'pending' && hasDocuments;
      }).length || 0;
      
      const totalProperties = properties?.length || 0;
      const activeProperties = properties?.filter(p => p.is_active).length || 0;
      
      const totalRaces = races?.length || 0;
      const activeRaces = races?.filter(r => r.is_active).length || 0;
      
      const totalBookings = bookings?.length || 0;
      const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
      
      const totalPointsInSystem = profiles?.reduce((sum, p) => sum + (p.points_balance || 0), 0) || 0;
      const avgUserRating = profiles?.reduce((sum, p) => sum + (p.average_rating || 0), 0) / totalUsers || 0;
      
      // Usuarios nuevos este mes
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const newUsersThisMonth = profiles?.filter(p => 
        new Date(p.created_at) >= thisMonth
      ).length || 0;

      setStats({
        totalUsers,
        verifiedUsers,
        pendingVerifications,
        totalProperties,
        activeProperties,
        totalRaces,
        activeRaces,
        totalBookings,
        completedBookings,
        totalPointsInSystem,
        avgUserRating,
        newUsersThisMonth
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNewUsers = async () => {
    try {
      const data = await AdminService.getNewUsers(50);
      setNewUsers(data);
    } catch (error) {
      console.error('Error fetching new users:', error);
    }
  };

  const fetchSubscriptionRenewals = async () => {
    try {
      const data = await AdminService.getSubscriptionRenewals(50);
      setRenewals(data);
    } catch (error) {
      console.error('Error fetching subscription renewals:', error);
    }
  };

  const fetchAccountDeletions = async () => {
    try {
      // Fetch deletion records
      const data = await AdminService.getAccountDeletions(50);
      setDeletions(data);

      // Fetch deletion statistics
      const statsData = await AdminService.getDeletionStats();
      if (statsData) {
        setDeletionStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching account deletions:', error);
    }
  };

  const refreshData = async () => {
    setLoadingDetails(true);
    await Promise.all([
      fetchSystemStats(),
      fetchNewUsers(),
      fetchSubscriptionRenewals(),
      fetchAccountDeletions()
    ]);
    setLoadingDetails(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVerificationStatusDisplay = (status: string | null | undefined, documents: string[] | null | undefined) => {
    // Check if user has uploaded any documents
    const hasDocuments = documents && Array.isArray(documents) && documents.length > 0;
    
    // Handle null, undefined, or empty status
    if (!status || status.trim() === '') {
      return hasDocuments ? 'Pendiente' : 'Sin Verificar';
    }
    
    // Normalize status to lowercase for comparison
    const normalizedStatus = status.toLowerCase().trim();
    
    switch (normalizedStatus) {
      case 'pending':
        // Distinguish between users who have uploaded documents vs those who haven't
        return hasDocuments ? 'Pendiente' : 'Sin Verificar';
      case 'verified':
      case 'approved':
        return 'Verificado';
      case 'rejected':
        return 'Rechazado';
      default:
        // For any unexpected status, check if they have documents
        return hasDocuments ? 'Pendiente' : 'Sin Verificar';
    }
  };

  const getStatusBadgeColor = (status: string | null | undefined, documents: string[] | null | undefined) => {
    // Check if user has uploaded any documents
    const hasDocuments = documents && Array.isArray(documents) && documents.length > 0;
    
    // Handle null, undefined, or empty status
    if (!status || status.trim() === '') {
      return hasDocuments ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800';
    }
    
    // Normalize status to lowercase for comparison
    const normalizedStatus = status.toLowerCase().trim();
    
    switch (normalizedStatus) {
      case 'verified':
      case 'approved':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        // Yellow for pending with documents, blue for no documents
        return hasDocuments ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800';
      case 'rejected':
      case 'self_deleted':
        return 'bg-red-100 text-red-800';
      case 'admin_deleted':
        return 'bg-gray-100 text-gray-800';
      default:
        // For any unexpected status, use yellow if they have documents, blue if they don't
        return hasDocuments ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Estadísticas del Sistema</h2>
        <Button 
          onClick={refreshData} 
          disabled={loadingDetails}
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loadingDetails ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Resumen General
          </TabsTrigger>
          <TabsTrigger value="new-users" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Nuevos Usuarios
          </TabsTrigger>
          <TabsTrigger value="renewals" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Renovaciones
          </TabsTrigger>
          <TabsTrigger value="deletions" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            Eliminaciones
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Usuarios */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
                    <p className="text-3xl font-bold">{stats.totalUsers}</p>
                    <p className="text-xs text-muted-foreground">+{stats.newUsersThisMonth} este mes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verificaciones */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Shield className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Verificados</p>
                    <p className="text-3xl font-bold">{stats.verifiedUsers}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.pendingVerifications} pendientes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Propiedades */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Home className="h-8 w-8 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Propiedades</p>
                    <p className="text-3xl font-bold">{stats.totalProperties}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.activeProperties} activas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Carreras */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Carreras</p>
                    <p className="text-3xl font-bold">{stats.totalRaces}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.activeRaces} activas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Reservas */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reservas</p>
                    <p className="text-3xl font-bold">{stats.totalBookings}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.completedBookings} completadas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Puntos en el Sistema */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Puntos Sistema</p>
                    <p className="text-3xl font-bold">{stats.totalPointsInSystem.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total circulando</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rating Promedio */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Star className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rating Promedio</p>
                    <p className="text-3xl font-bold">{stats.avgUserRating.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">De usuarios activos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Deletions */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <UserX className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Eliminaciones</p>
                    <p className="text-3xl font-bold">{deletionStats?.total_deletions || 0}</p>
                    <p className="text-xs text-muted-foreground">
                      {deletionStats?.this_month || 0} este mes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estado del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Usuarios Verificados:</span>
                    <span className="font-medium">
                      {((stats.verifiedUsers / Math.max(stats.totalUsers, 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Propiedades Activas:</span>
                    <span className="font-medium">
                      {((stats.activeProperties / Math.max(stats.totalProperties, 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Carreras Activas:</span>
                    <span className="font-medium">
                      {((stats.activeRaces / Math.max(stats.totalRaces, 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verificaciones Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold text-yellow-600">
                    {stats.pendingVerifications}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Solicitudes esperando revisión
                  </p>
                  {stats.pendingVerifications > 0 && (
                    <p className="text-xs text-destructive mt-2">
                      ⚠️ Requiere atención
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Crecimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Nuevos usuarios este mes:</span>
                    <span className="font-medium text-green-600">+{stats.newUsersThisMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Promedio puntos/usuario:</span>
                    <span className="font-medium">
                      {Math.round(stats.totalPointsInSystem / Math.max(stats.totalUsers, 1))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Reservas/carrera:</span>
                    <span className="font-medium">
                      {(stats.totalBookings / Math.max(stats.totalRaces, 1)).toFixed(1)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* New Users Tab */}
        <TabsContent value="new-users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Usuarios Registrados Recientemente
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Mostrando los últimos 50 usuarios registrados
              </div>
            </CardHeader>
            <CardContent>
              {loadingDetails ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : newUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay usuarios nuevos</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {newUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-medium">
                                {user.first_name && user.last_name 
                                  ? `${user.first_name} ${user.last_name}` 
                                  : user.email}
                              </p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getStatusBadgeColor(user.verification_status, user.verification_documents)}>
                                {getVerificationStatusDisplay(user.verification_status, user.verification_documents)}
                              </Badge>
                              {user.is_host && <Badge variant="outline">Host</Badge>}
                              {user.is_guest && <Badge variant="outline">Guest</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatDate(user.created_at)}</p>
                          <p className="text-xs text-muted-foreground">Registrado</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Renewals Tab */}
        <TabsContent value="renewals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Renovaciones de Suscripción
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Suscripciones activas y sus períodos de renovación
              </div>
            </CardHeader>
            <CardContent>
              {loadingDetails ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : renewals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay renovaciones registradas</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {renewals.map((renewal) => (
                      <div key={renewal.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-medium">{renewal.user_name || renewal.user_email}</p>
                              <p className="text-sm text-muted-foreground">{renewal.user_email}</p>
                              <p className="text-sm text-blue-600 font-medium">{renewal.plan_name}</p>
                            </div>
                            <Badge className={getStatusBadgeColor(renewal.status)}>
                              {renewal.status === 'active' ? 'Activa' : renewal.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatDate(renewal.current_period_end)}
                          </p>
                          <p className="text-xs text-muted-foreground">Próxima renovación</p>
                          <p className="text-xs text-muted-foreground">
                            Iniciado: {formatDate(renewal.current_period_start)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deletions Tab */}
        <TabsContent value="deletions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <UserX className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Eliminadas</p>
                    <p className="text-3xl font-bold">{deletionStats?.total_deletions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Auto-eliminadas</p>
                    <p className="text-3xl font-bold">{deletionStats?.self_deletions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Shield className="h-8 w-8 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Admin-eliminadas</p>
                    <p className="text-3xl font-bold">{deletionStats?.admin_deletions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Este Mes</p>
                    <p className="text-3xl font-bold">{deletionStats?.this_month || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Historial de Eliminaciones de Cuentas
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Registro de cuentas eliminadas (auto-eliminaciones y eliminaciones por admin)
              </div>
            </CardHeader>
            <CardContent>
              {loadingDetails ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : deletions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay eliminaciones registradas</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {deletions.map((deletion) => (
                      <div key={deletion.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-medium">
                                {deletion.first_name && deletion.last_name 
                                  ? `${deletion.first_name} ${deletion.last_name}` 
                                  : deletion.email}
                              </p>
                              <p className="text-sm text-muted-foreground">{deletion.email}</p>
                              {deletion.deletion_reason && (
                                <p className="text-sm text-gray-600 mt-1">Razón: {deletion.deletion_reason}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getStatusBadgeColor(deletion.deletion_type)}>
                                {deletion.deletion_type === 'self_deleted' ? 'Auto-eliminada' : 'Admin-eliminada'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatDate(deletion.deleted_at)}</p>
                          <p className="text-xs text-muted-foreground">Eliminada</p>
                          <div className="text-xs text-muted-foreground mt-1">
                            <p>Reservas: {deletion.total_bookings}</p>
                            <p>Puntos: {deletion.total_points_at_deletion}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminStatsPanel;