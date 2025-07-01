import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { 
  User, 
  Home, 
  Trophy, 
  Calendar, 
  Star, 
  MapPin,
  Phone,
  Mail,
  Shield,
  Activity
} from "lucide-react";

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

interface UserDetailData {
  profile: any;
  properties: any[];
  races: any[];
  guestBookings: any[];
  hostBookings: any[];
  stats: {
    totalProperties: number;
    totalRaces: number;
    totalGuestBookings: number;
    totalHostBookings: number;
    averageRating: number;
    pointsBalance: number;
  };
}

const AdminUserDetailsModal = ({ isOpen, onClose, userId, userName }: UserDetailsModalProps) => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserDetailData | null>(null);

  const fetchUserDetails = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Perfil del usuario
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Propiedades del usuario
      const { data: properties } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (*)
        `)
        .eq('owner_id', userId);

      // Carreras del usuario
      const { data: races } = await supabase
        .from('races')
        .select(`
          *,
          race_images (*),
          property:properties (title, locality)
        `)
        .eq('host_id', userId);

      // Reservas como guest
      const { data: guestBookings } = await supabase
        .from('bookings')
        .select(`
          *,
          race:races (name, race_date),
          host:profiles!bookings_host_id_fkey (first_name, last_name),
          property:properties (title, locality)
        `)
        .eq('guest_id', userId)
        .order('created_at', { ascending: false });

      // Reservas como host
      const { data: hostBookings } = await supabase
        .from('bookings')
        .select(`
          *,
          race:races (name, race_date),
          guest:profiles!bookings_guest_id_fkey (first_name, last_name),
          property:properties (title, locality)
        `)
        .eq('host_id', userId)
        .order('created_at', { ascending: false });

      setUserData({
        profile,
        properties: properties || [],
        races: races || [],
        guestBookings: guestBookings || [],
        hostBookings: hostBookings || [],
        stats: {
          totalProperties: properties?.length || 0,
          totalRaces: races?.length || 0,
          totalGuestBookings: guestBookings?.length || 0,
          totalHostBookings: hostBookings?.length || 0,
          averageRating: profile?.average_rating || 0,
          pointsBalance: profile?.points_balance || 0,
        }
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
    }
  }, [isOpen, userId]);

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!userData) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completado</Badge>;
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-800">Aceptado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-6 w-6" />
            <span>Detalles de Usuario: {userName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estadísticas Generales */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Propiedades</p>
                    <p className="text-2xl font-bold">{userData.stats.totalProperties}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Carreras</p>
                    <p className="text-2xl font-bold">{userData.stats.totalRaces}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Como Guest</p>
                    <p className="text-2xl font-bold">{userData.stats.totalGuestBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Como Host</p>
                    <p className="text-2xl font-bold">{userData.stats.totalHostBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <p className="text-2xl font-bold">{userData.stats.averageRating.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Puntos</p>
                    <p className="text-2xl font-bold">{userData.stats.pointsBalance}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información del Perfil */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Email:</span>
                    <span>{userData.profile.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Teléfono:</span>
                    <span>{userData.profile.phone || 'No especificado'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Verificación:</span>
                    {getStatusBadge(userData.profile.verification_status)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Experiencia Running:</span>
                    <span>{userData.profile.running_experience || 'No especificada'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Rol Host:</span>
                    <Badge variant={userData.profile.is_host ? "default" : "secondary"}>
                      {userData.profile.is_host ? 'Sí' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Rol Guest:</span>
                    <Badge variant={userData.profile.is_guest ? "default" : "secondary"}>
                      {userData.profile.is_guest ? 'Sí' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs con Detalles */}
          <Tabs defaultValue="properties" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="properties">Propiedades ({userData.properties.length})</TabsTrigger>
              <TabsTrigger value="races">Carreras ({userData.races.length})</TabsTrigger>
              <TabsTrigger value="guest-bookings">Como Guest ({userData.guestBookings.length})</TabsTrigger>
              <TabsTrigger value="host-bookings">Como Host ({userData.hostBookings.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="properties" className="space-y-4">
              {userData.properties.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No tiene propiedades registradas</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userData.properties.map((property) => (
                    <Card key={property.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{property.title}</h4>
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              <span>{property.locality}</span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
                              <span>{property.bedrooms} dormitorios</span>
                              <span>{property.max_guests} huéspedes máx</span>
                              <span>{property.total_bookings} reservas</span>
                            </div>
                          </div>
                          <Badge variant={property.is_active ? "default" : "secondary"}>
                            {property.is_active ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="races" className="space-y-4">
              {userData.races.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No tiene carreras registradas</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userData.races.map((race) => (
                    <Card key={race.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{race.name}</h4>
                            <div className="text-sm text-muted-foreground mt-1">
                              <p>Fecha: {new Date(race.race_date).toLocaleDateString()}</p>
                              <p>Propiedad: {race.property?.title}</p>
                              <p>Localidad: {race.property?.locality}</p>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
                              <span>{race.total_bookings} reservas</span>
                              <span>{race.points_cost} puntos</span>
                            </div>
                          </div>
                          <Badge variant={race.is_active ? "default" : "secondary"}>
                            {race.is_active ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="guest-bookings" className="space-y-4">
              {userData.guestBookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No tiene reservas como guest</p>
              ) : (
                <div className="space-y-3">
                  {userData.guestBookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{booking.race?.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Host: {booking.host?.first_name} {booking.host?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Propiedad: {booking.property?.title} - {booking.property?.locality}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true, locale: es })}
                            </p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(booking.status)}
                            <p className="text-sm font-medium mt-1">{booking.points_cost} puntos</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="host-bookings" className="space-y-4">
              {userData.hostBookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No tiene reservas como host</p>
              ) : (
                <div className="space-y-3">
                  {userData.hostBookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{booking.race?.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Guest: {booking.guest?.first_name} {booking.guest?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Propiedad: {booking.property?.title} - {booking.property?.locality}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true, locale: es })}
                            </p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(booking.status)}
                            <p className="text-sm font-medium mt-1">{booking.points_cost} puntos</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminUserDetailsModal;