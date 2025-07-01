import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Home, 
  Trophy, 
  Calendar, 
  TrendingUp, 
  Shield,
  Activity,
  Star
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

const AdminStatsPanel = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSystemStats = async () => {
    try {
      // Total usuarios y verificaciones
      const { data: profiles } = await supabase
        .from('profiles')
        .select('verification_status, points_balance, average_rating, created_at');

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

      // Calcular estadísticas
      const totalUsers = profiles?.length || 0;
      const verifiedUsers = profiles?.filter(p => p.verification_status === 'approved').length || 0;
      const pendingVerifications = profiles?.filter(p => p.verification_status === 'pending').length || 0;
      
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

  useEffect(() => {
    fetchSystemStats();
  }, []);

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

      {/* Segunda fila de estadísticas */}
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

        {/* Tasa de Actividad */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tasa Actividad</p>
                <p className="text-3xl font-bold">
                  {((stats.completedBookings / Math.max(stats.totalBookings, 1)) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Reservas completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tarjetas de Resumen */}
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
    </div>
  );
};

export default AdminStatsPanel;