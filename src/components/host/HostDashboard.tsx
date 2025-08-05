import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Star, 
  Shield, 
  Phone, 
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  User
} from "lucide-react";
import { Booking } from "@/types/booking";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings } from "@/hooks/useBookings";
import { toast } from "sonner";
import { GuestInfoModal } from "@/components/bookings/GuestInfoModal";

interface HostDashboardProps {
  onViewBookingDetails?: (booking: Booking) => void;
}

const HostDashboard = ({ onViewBookingDetails }: HostDashboardProps) => {
  const { user } = useAuth();
  const { bookings, stats, respondToBooking, loading, refetchBookings } = useBookings({ role: 'host' });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseType, setResponseType] = useState<'accepted' | 'rejected'>('accepted');
  const [responseMessage, setResponseMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showGuestInfoModal, setShowGuestInfoModal] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);

  // Debug logging for bookings
  useEffect(() => {
    if (bookings) {
      console.log('HostDashboard: Fetched bookings:', bookings.length, 'for user:', user?.id);
    }
  }, [bookings, user?.id]);

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    if (!user?.id) return;
    
    const interval = setInterval(() => {
      console.log('HostDashboard: Auto-refreshing bookings...');
      refetchBookings();
    }, 30 * 1000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [user?.id, refetchBookings]);

  // Filtrar solo solicitudes pendientes para el host
  const pendingRequests = bookings?.filter(
    b => b.status === 'pending' && b.host_id === user?.id
  ) || [];
  
  console.log('HostDashboard: Pending requests for host:', pendingRequests);

  const acceptedBookings = bookings?.filter(
    b => b.status === 'accepted' && b.host_id === user?.id
  ) || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTimeRemaining = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    if (diffHours <= 0) return { text: 'Expirado', color: 'text-red-600', urgent: true };
    if (diffHours <= 6) return { text: `${diffHours}h restantes`, color: 'text-red-600', urgent: true };
    if (diffHours <= 24) return { text: `${diffHours}h restantes`, color: 'text-orange-600', urgent: true };
    return { text: `${Math.ceil(diffHours / 24)}d restantes`, color: 'text-gray-600', urgent: false };
  };

  const handleQuickResponse = (booking: Booking, response: 'accepted' | 'rejected') => {
    setSelectedBooking(booking);
    setResponseType(response);
    setResponseMessage('');
    setShowResponseModal(true);
  };

  const handleViewDetails = (booking: Booking) => {
    if (onViewBookingDetails) {
      onViewBookingDetails(booking);
    } else {
      // Mostrar modal de detalles interno
      setSelectedBooking(booking);
      setShowResponseModal(true);
    }
  };

  const handleViewGuestInfo = (guestId: string) => {
    setSelectedGuestId(guestId);
    setShowGuestInfoModal(true);
  };

  const submitResponse = async () => {
    if (!selectedBooking) return;

    setSubmitting(true);
    try {
      const success = await respondToBooking(
        selectedBooking.id, 
        responseType, 
        responseMessage || undefined
      );
      
      if (success) {
        setShowResponseModal(false);
        setSelectedBooking(null);
        setResponseMessage('');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Host</h1>
          <p className="text-gray-600">Gestiona tus solicitudes de reserva</p>
        </div>
        <Button
          onClick={refetchBookings}
          variant="outline"
          size="sm"
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Aceptadas</p>
                <p className="text-2xl font-bold">{acceptedBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Aceptación</p>
                <p className="text-2xl font-bold">{stats.acceptanceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Puntos Ganados</p>
                <p className="text-2xl font-bold">{stats.totalPointsEarned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <span>Solicitudes Pendientes ({pendingRequests.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay solicitudes pendientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((booking) => {
                const timeRemaining = getTimeRemaining(booking.host_response_deadline);
                return (
                  <Card key={booking.id} className={`border-l-4 ${timeRemaining.urgent ? 'border-l-red-500' : 'border-l-orange-500'}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3 flex-1">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={booking.guest?.profile_image_url} />
                            <AvatarFallback>
                              {booking.guest?.first_name?.[0]}{booking.guest?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold">
                                {booking.guest?.first_name} {booking.guest?.last_name}
                              </h3>
                              {booking.guest?.verification_status === 'approved' && (
                                <Shield className="w-4 h-4 text-green-500" />
                              )}
                              {booking.guest?.average_rating && (
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  <span className="text-sm">{booking.guest.average_rating}</span>
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewGuestInfo(booking.guest_id)}
                                className="h-6 px-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700"
                              >
                                <User className="w-3 h-3 mr-1" />
                                Info Runner
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">{booking.race?.name}</span>
                              </div>
                              <div>
                                {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                              </div>
                              <div>
                                {booking.guests_count} huésped{booking.guests_count > 1 ? 'es' : ''}
                              </div>
                              <div className="font-medium">
                                {booking.points_cost} puntos
                              </div>
                            </div>
                            
                            {booking.request_message && (
                              <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                                "{booking.request_message}"
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2">
                          <Badge 
                            variant="outline" 
                            className={`${timeRemaining.color} border-current`}
                          >
                            {timeRemaining.text}
                          </Badge>
                          
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(booking)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleQuickResponse(booking, 'accepted')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Aceptar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickResponse(booking, 'rejected')}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Modal */}
      <Dialog open={showResponseModal} onOpenChange={setShowResponseModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {responseType === 'accepted' ? 'Aceptar' : 'Rechazar'} Solicitud
            </DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Guest Info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedBooking.guest?.profile_image_url} />
                    <AvatarFallback>
                      {selectedBooking.guest?.first_name?.[0]}{selectedBooking.guest?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {selectedBooking.guest?.first_name} {selectedBooking.guest?.last_name}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      {selectedBooking.guest?.verification_status === 'approved' && (
                        <>
                          <Shield className="w-4 h-4 text-green-500" />
                          <span>Verificado</span>
                        </>
                      )}
                      {selectedBooking.guest?.average_rating && (
                        <>
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span>{selectedBooking.guest.average_rating}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewGuestInfo(selectedBooking.guest_id)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                >
                  <User className="w-4 h-4 mr-1" />
                  Ver Perfil Runner
                </Button>
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Carrera</Label>
                  <p className="font-medium">{selectedBooking.race?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Propiedad</Label>
                  <p className="font-medium">{selectedBooking.property?.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Check-in</Label>
                  <p className="font-medium">{formatDate(selectedBooking.check_in_date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Check-out</Label>
                  <p className="font-medium">{formatDate(selectedBooking.check_out_date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Huéspedes</Label>
                  <p className="font-medium">{selectedBooking.guests_count}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Puntos a recibir</Label>
                  <p className="font-medium text-green-600">{selectedBooking.points_cost} puntos</p>
                </div>
              </div>

              {/* Guest Message */}
              {selectedBooking.request_message && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Mensaje del huésped</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{selectedBooking.request_message}</p>
                  </div>
                </div>
              )}

              {/* Special Requests */}
              {selectedBooking.special_requests && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Solicitudes especiales</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{selectedBooking.special_requests}</p>
                  </div>
                </div>
              )}

              {/* Contact Info (if accepting) */}
              {responseType === 'accepted' && selectedBooking.guest_phone && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Teléfono de contacto</Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{selectedBooking.guest_phone}</span>
                  </div>
                </div>
              )}

              {/* Response Message */}
              <div>
                <Label htmlFor="response-message">
                  Mensaje {responseType === 'accepted' ? '(opcional)' : '(requerido)'}
                </Label>
                <Textarea
                  id="response-message"
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder={
                    responseType === 'accepted' 
                      ? "Mensaje de bienvenida, instrucciones de llegada, etc." 
                      : "Motivo del rechazo (requerido)"
                  }
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setShowResponseModal(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={submitResponse}
                  disabled={submitting || (responseType === 'rejected' && !responseMessage.trim())}
                  className={responseType === 'accepted' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {submitting ? 'Enviando...' : (responseType === 'accepted' ? 'Aceptar Solicitud' : 'Rechazar Solicitud')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Guest Info Modal */}
      <GuestInfoModal
        isOpen={showGuestInfoModal}
        onClose={() => {
          setShowGuestInfoModal(false);
          setSelectedGuestId(null);
        }}
        guestId={selectedGuestId || ''}
      />
    </div>
  );
};

export default HostDashboard;
