import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfilePhotoModal } from "@/components/common/ProfilePhotoModal";
import { VerificationPhotosModal } from "./VerificationPhotosModal";
import { AdminStorageService } from "@/services/adminStorageService";
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
  Activity,
  Camera,
  FileText,
  Eye
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
  const [showProfilePhotoModal, setShowProfilePhotoModal] = useState(false);
  const [showVerificationPhotosModal, setShowVerificationPhotosModal] = useState(false);
  const [verificationPhotos, setVerificationPhotos] = useState<Array<{url: string, type: string, index: number}>>([]);
  const [loadingVerificationPhotos, setLoadingVerificationPhotos] = useState(false);

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

      // Reservas como guest - Fix foreign key reference
      const { data: guestBookings, error: guestError } = await supabase
        .from('bookings')
        .select(`
          *,
          races!inner (name, race_date),
          properties!inner (title, locality)
        `)
        .eq('guest_id', userId)
        .order('created_at', { ascending: false });

      if (guestError) {
        console.warn('Error fetching guest bookings:', guestError);
      }

      // Reservas como host - Fix foreign key reference
      const { data: hostBookings, error: hostError } = await supabase
        .from('bookings')
        .select(`
          *,
          races!inner (name, race_date),
          properties!inner (title, locality)
        `)
        .eq('host_id', userId)
        .order('created_at', { ascending: false });

      if (hostError) {
        console.warn('Error fetching host bookings:', hostError);
      }

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
      
      // Load verification photos using AdminStorageService
      if (profile?.verification_documents) {
        await loadVerificationPhotos(profile.verification_documents);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVerificationPhotos = async (documents: string[] | string) => {
    try {
      setLoadingVerificationPhotos(true);
      console.log('Loading verification photos for documents:', documents);
      
      // Handle both array and string formats
      let documentPaths: string[] = [];
      if (typeof documents === 'string') {
        try {
          documentPaths = JSON.parse(documents);
        } catch (e) {
          console.error('Error parsing verification documents:', e);
          setVerificationPhotos([]);
          return;
        }
      } else if (Array.isArray(documents)) {
        documentPaths = documents;
      }
      
      if (!Array.isArray(documentPaths) || documentPaths.length === 0) {
        console.log('No verification documents to load');
        setVerificationPhotos([]);
        return;
      }
      
      console.log('Fetching signed URLs for documents:', documentPaths);
      const urlResults = await AdminStorageService.getVerificationDocumentUrls(documentPaths);
      console.log('AdminStorageService results:', urlResults);
      
      // Check if AdminStorageService is properly configured
      const isServiceRoleConfigured = AdminStorageService.isServiceRoleAvailable();
      console.log('Service role configured:', isServiceRoleConfigured);
      
      const photos = urlResults
        .filter(result => result.url && !result.error)
        .map((result, index) => ({
          url: result.url!,
          type: 'verification',
          index
        }));
      
      console.log('Successfully loaded verification photos:', photos);
      setVerificationPhotos(photos);
      
      // Log any errors with helpful context
      const errors = urlResults.filter(result => result.error);
      if (errors.length > 0) {
        console.warn('Some verification documents could not be loaded:', errors);
        if (!isServiceRoleConfigured) {
          console.warn('Service role not configured - set VITE_SUPABASE_SERVICE_ROLE_KEY for admin access to verification documents');
        }
      }
      
    } catch (error) {
      console.error('Error loading verification photos:', error);
      setVerificationPhotos([]);
    } finally {
      setLoadingVerificationPhotos(false);
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
          <DialogHeader className="sr-only">
            <DialogTitle>Cargando detalles de usuario</DialogTitle>
          </DialogHeader>
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
    <>
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

          {/* Fotos y Verificación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Foto de Perfil */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="h-5 w-5" />
                  <span>Foto de Perfil</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4 p-6">
                {userData.profile.profile_image_url ? (
                  <>
                    <Avatar 
                      className="w-40 h-40 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all duration-200 shadow-lg"
                      onClick={() => setShowProfilePhotoModal(true)}
                      title="Hacer clic para ver en tamaño completo"
                    >
                      <AvatarImage 
                        src={userData.profile.profile_image_url} 
                        onError={(e) => {
                          console.error('Error loading profile image:', userData.profile.profile_image_url);
                        }}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-4xl font-semibold">
                        {userData.profile.first_name?.[0]}{userData.profile.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <p className="font-medium text-lg">
                        {userData.profile.first_name && userData.profile.last_name 
                          ? `${userData.profile.first_name} ${userData.profile.last_name}` 
                          : 'Usuario'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowProfilePhotoModal(true)}
                        className="mt-2"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver en tamaño completo
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-base font-medium">Sin foto de perfil</p>
                    <p className="text-sm text-gray-400 mt-1">Este usuario no ha subido una foto</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documentos de Verificación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Documentos de Verificación</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estado:</span>
                  {getStatusBadge(userData.profile.verification_status)}
                </div>
                
                {loadingVerificationPhotos ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Cargando documentos...</p>
                  </div>
                ) : verificationPhotos.length > 0 ? (
                  <>
                    <div className="text-sm text-gray-600">
                      {verificationPhotos.length} documento(s) disponible(s)
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {verificationPhotos.slice(0, 3).map((photo, index) => (
                        <div key={index} className="relative aspect-square">
                          <img
                            src={photo.url}
                            alt={`Documento ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg border border-gray-200 cursor-pointer hover:border-blue-500 transition-colors"
                            onClick={() => setShowVerificationPhotosModal(true)}
                            onLoad={() => console.log('Admin preview thumbnail loaded:', photo.url)}
                            onError={(e) => {
                              console.error('Error loading admin preview thumbnail:', photo.url);
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MS42NjY3IDMzLjMzMzNINTguMzMzM0M1OS4yNTM4IDMzLjMzMzMgNjAgMzQuMDc5NSA2MCAzNVY2NUM2MCA2NS45MjA1IDU5LjI1MzggNjYuNjY2NyA1OC4zMzMzIDY2LjY2NjdINDEuNjY2N0M0MC43NDYyIDY2LjY2NjcgNDAgNjUuOTIwNSA0MCA2NVYzNUM0MCAzNC4wNzk1IDQwLjc0NjIgMzMuMzMzMyA0MS42NjY3IDMzLjMzMzNaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMSIvPgo8cGF0aCBkPSJNNDYuNjY2NyA0NS4yMkw1My4zMzMzIDUxLjY2NjdMNjEuNjY2NyA0My4zMzMzIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjx0ZXh0IHg9IjUwIiB5PSI4MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgiIGZpbGw9IiM2QjczODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVycm9yPC90ZXh0Pgo8L3N2Zz4=';
                            }}
                          />
                          {verificationPhotos.length > 3 && index === 2 && (
                            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                              +{verificationPhotos.length - 3}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVerificationPhotosModal(true)}
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver todos los documentos
                    </Button>
                  </>
                ) : (
                  <div className="text-center text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Sin documentos de verificación</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
                            <h4 className="font-medium">{booking.races?.name || 'Carrera no disponible'}</h4>
                            <p className="text-sm text-muted-foreground">
                              Fecha: {booking.races?.race_date ? new Date(booking.races.race_date).toLocaleDateString() : 'No disponible'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Propiedad: {booking.properties?.title || 'No disponible'} - {booking.properties?.locality || ''}
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
                            <h4 className="font-medium">{booking.races?.name || 'Carrera no disponible'}</h4>
                            <p className="text-sm text-muted-foreground">
                              Fecha: {booking.races?.race_date ? new Date(booking.races.race_date).toLocaleDateString() : 'No disponible'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Propiedad: {booking.properties?.title || 'No disponible'} - {booking.properties?.locality || ''}
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

    {/* Profile Photo Modal */}
    {userData?.profile?.profile_image_url && (
      <ProfilePhotoModal
        isOpen={showProfilePhotoModal}
        onClose={() => setShowProfilePhotoModal(false)}
        imageUrl={userData.profile.profile_image_url}
        userName={userName}
      />
    )}

    {/* Verification Photos Modal */}
    <VerificationPhotosModal
      isOpen={showVerificationPhotosModal}
      onClose={() => setShowVerificationPhotosModal(false)}
      photos={verificationPhotos}
      userName={userName}
      title="Documentos de Verificación"
    />
  </>
  );
};

export default AdminUserDetailsModal;