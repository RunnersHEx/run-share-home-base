
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Users, MapPin, MessageSquare, Check, X, User, Loader2 } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { GuestInfoModal } from "@/components/bookings/GuestInfoModal";

const BookingsSection = () => {
  const { user } = useAuth();
  const { bookings, loading, respondToBooking, confirmBooking, completeBooking, cancelBooking } = useBookings();
  const [activeTab, setActiveTab] = useState("received");
  const [showGuestInfoModal, setShowGuestInfoModal] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [loadingBookings, setLoadingBookings] = useState<Set<string>>(new Set());
  const [processingAction, setProcessingAction] = useState<Record<string, string>>({});
  const debounceTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clear all debounce timers
      Object.values(debounceTimersRef.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Filter bookings based on user role
  const receivedBookings = bookings.filter(booking => booking.host_id === user?.id);
  const sentBookings = bookings.filter(booking => booking.guest_id === user?.id);

  // Safe state update helper
  const updateStatesSafely = useCallback((bookingId: string, updates: {
    loading?: boolean;
    action?: string | null;
  }) => {
    if (!isMountedRef.current) return;
    
    if (updates.loading !== undefined) {
      setLoadingBookings(prev => {
        const newSet = new Set(prev);
        if (updates.loading) {
          newSet.add(bookingId);
        } else {
          newSet.delete(bookingId);
        }
        return newSet;
      });
    }
    
    if (updates.action !== undefined) {
      setProcessingAction(prev => {
        const newState = { ...prev };
        if (updates.action) {
          newState[bookingId] = updates.action;
        } else {
          delete newState[bookingId];
        }
        return newState;
      });
    }
  }, []);

  // Simple debounce helper using ref
  const debounce = useCallback((key: string, fn: () => void, delay: number = 300) => {
    // Clear existing timer
    if (debounceTimersRef.current[key]) {
      clearTimeout(debounceTimersRef.current[key]);
    }
    
    // Set new timer
    debounceTimersRef.current[key] = setTimeout(() => {
      fn();
      delete debounceTimersRef.current[key];
    }, delay);
  }, []);

  const handleBookingResponse = useCallback(async (bookingId: string, response: 'accepted' | 'rejected') => {
    // Prevent action if component is unmounted or already processing
    if (!isMountedRef.current || loadingBookings.has(bookingId)) return;
    
    // Debounce the action to prevent rapid clicks
    debounce(`booking-response-${bookingId}`, async () => {
      if (!isMountedRef.current || loadingBookings.has(bookingId)) return;
      
      // Check if booking still exists
      const currentBooking = bookings.find(b => b.id === bookingId);
      if (!currentBooking) {
        console.warn('Booking not found:', bookingId);
        return;
      }
      
      // Set loading state
      updateStatesSafely(bookingId, { loading: true, action: response });
      
      try {
        if (response === 'accepted') {
          // For acceptance, call both respond and confirm in sequence
          const success = await respondToBooking(bookingId, response);
          
          // Check if still mounted after first async operation
          if (!isMountedRef.current) return;
          
          if (success) {
            try {
              // Add small delay to ensure state is updated
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Check again if still mounted
              if (!isMountedRef.current) return;
              
              await confirmBooking(bookingId);
              
              // Final mount check before showing toast
              if (isMountedRef.current) {
                toast.success('Solicitud aceptada y confirmada correctamente');
              }
            } catch (error) {
              console.error('Auto-confirm error:', error);
              if (isMountedRef.current) {
                toast.error('Reserva aceptada pero error al confirmar automáticamente');
              }
            }
          }
        } else {
          // For rejection, just respond normally
          const success = await respondToBooking(bookingId, response);
          if (success && isMountedRef.current) {
            toast.success('Solicitud rechazada correctamente');
          }
        }
      } catch (error) {
        console.error('Error in handleBookingResponse:', error);
        if (isMountedRef.current) {
          toast.error('Error al procesar la solicitud');
        }
      } finally {
        // Clear loading state
        if (isMountedRef.current) {
          updateStatesSafely(bookingId, { loading: false, action: null });
        }
      }
    }, 300);
  }, [bookings, respondToBooking, confirmBooking, debounce, updateStatesSafely, loadingBookings]);

  const handleCompleteBooking = useCallback(async (bookingId: string) => {
    // Prevent action if component is unmounted or already processing
    if (!isMountedRef.current || loadingBookings.has(bookingId)) return;
    
    // Debounce the action to prevent rapid clicks
    debounce(`booking-complete-${bookingId}`, async () => {
      if (!isMountedRef.current || loadingBookings.has(bookingId)) return;
      
      // Set loading state
      updateStatesSafely(bookingId, { loading: true, action: 'completing' });
      
      try {
        const success = await completeBooking(bookingId);
        if (success && isMountedRef.current) {
          toast.success('Reserva completada correctamente');
        }
      } catch (error) {
        console.error('Error completing booking:', error);
        if (isMountedRef.current) {
          toast.error('Error al completar la reserva');
        }
      } finally {
        // Clear loading state
        if (isMountedRef.current) {
          updateStatesSafely(bookingId, { loading: false, action: null });
        }
      }
    }, 300);
  }, [completeBooking, debounce, updateStatesSafely, loadingBookings]);

  const handleCancelBooking = useCallback(async (bookingId: string) => {
    // Prevent action if component is unmounted or already processing
    if (!isMountedRef.current || loadingBookings.has(bookingId)) return;
    
    // Debounce the action to prevent rapid clicks
    debounce(`booking-cancel-${bookingId}`, async () => {
      if (!isMountedRef.current || loadingBookings.has(bookingId)) return;
      
      // Determine if user is host or guest for this booking
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) {
        console.warn('Booking not found for cancellation:', bookingId);
        return;
      }
      
      // Set loading state
      updateStatesSafely(bookingId, { loading: true, action: 'cancelling' });
      
      try {
        const isHost = booking.host_id === user?.id;
        const cancelledBy = isHost ? 'host' : 'guest';
        
        const success = await cancelBooking(bookingId, cancelledBy);
        if (success && isMountedRef.current) {
          toast.success('Reserva cancelada correctamente');
        }
      } catch (error) {
        console.error('Error cancelling booking:', error);
        if (isMountedRef.current) {
          toast.error('Error al cancelar la reserva');
        }
      } finally {
        // Clear loading state
        if (isMountedRef.current) {
          updateStatesSafely(bookingId, { loading: false, action: null });
        }
      }
    }, 300);
  }, [bookings, user?.id, cancelBooking, debounce, updateStatesSafely, loadingBookings]);

  const handleViewGuestInfo = useCallback((guestId: string) => {
    if (!isMountedRef.current) return;
    setSelectedGuestId(guestId);
    setShowGuestInfoModal(true);
  }, []);

  const handleCloseGuestModal = useCallback(() => {
    if (isMountedRef.current) {
      setShowGuestInfoModal(false);
      setSelectedGuestId(null);
    }
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      accepted: { label: 'Aceptada', color: 'bg-green-100 text-green-700 border-green-200' },
      rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-700 border-red-200' },
      confirmed: { label: 'Confirmada', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      completed: { label: 'Completada', color: 'bg-gray-100 text-gray-700 border-gray-200' },
      cancelled: { label: 'Cancelada', color: 'bg-gray-100 text-gray-700 border-gray-200' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Solicitudes</h2>
        <p className="text-gray-600">Administra las solicitudes de reserva de tus carreras y tus propias reservas</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received">
            Solicitudes Recibidas ({receivedBookings.length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Mis Solicitudes Enviadas ({sentBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {receivedBookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay solicitudes recibidas
                </h3>
                <p className="text-gray-600">
                  Cuando publiques carreras, las solicitudes de reserva aparecerán aquí
                </p>
              </CardContent>
            </Card>
          ) : (
            receivedBookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {booking.race?.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-sm text-gray-600">
                          Solicitud de: {booking.guest?.first_name} {booking.guest?.last_name}
                        </p>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleViewGuestInfo(booking.guest_id)}
                          className="h-8 px-4 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          Info Runner
                        </Button>
                      </div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Booking Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{booking.guests_count} {booking.guests_count === 1 ? 'guest' : 'guests'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{booking.property?.locality}</span>
                    </div>
                  </div>

                  {/* Guest Message */}
                  {booking.request_message && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Mensaje del guest:</p>
                      <p className="text-sm text-gray-600">{booking.request_message}</p>
                    </div>
                  )}

                  {/* Special Requests */}
                  {booking.special_requests && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-700 mb-1">Solicitudes especiales:</p>
                      <p className="text-sm text-blue-600">{booking.special_requests}</p>
                    </div>
                  )}

                  {/* Completion reminder for confirmed bookings */}
                  {booking.status === 'confirmed' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 font-medium">
                        Experiencia completada. No olvides ir a tu sección de valoraciones para calificar a tu huésped.
                      </p>
                    </div>
                  )}

                  {/* Cancel Button for Accepted Bookings */}
                  {booking.status === 'accepted' && (
                    <div className="flex justify-center pt-2">
                      <Button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={loadingBookings.has(booking.id)}
                        className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                      >
                        {loadingBookings.has(booking.id) && processingAction[booking.id] === 'cancelling' ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <X className="w-4 h-4 mr-2" />
                        )}
                        {loadingBookings.has(booking.id) && processingAction[booking.id] === 'cancelling' ? 'Cancelando...' : 'Cancelar'}
                      </Button>
                    </div>
                  )}

                  {/* Complete and Cancel Buttons for Confirmed Bookings */}
                  {booking.status === 'confirmed' && (
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={() => handleCompleteBooking(booking.id)}
                        disabled={loadingBookings.has(booking.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                      >
                        {loadingBookings.has(booking.id) && processingAction[booking.id] === 'completing' ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        {loadingBookings.has(booking.id) && processingAction[booking.id] === 'completing' ? 'Completando...' : 'Completar'}
                      </Button>
                      <Button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={loadingBookings.has(booking.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                      >
                        {loadingBookings.has(booking.id) && processingAction[booking.id] === 'cancelling' ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <X className="w-4 h-4 mr-2" />
                        )}
                        {loadingBookings.has(booking.id) && processingAction[booking.id] === 'cancelling' ? 'Cancelando...' : 'Cancelar'}
                      </Button>
                    </div>
                  )}

                  {/* Action Buttons for Pending Requests */}
                  {booking.status === 'pending' && (
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={() => handleBookingResponse(booking.id, 'accepted')}
                        disabled={loadingBookings.has(booking.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                      >
                        {loadingBookings.has(booking.id) && processingAction[booking.id] === 'accepted' ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        {loadingBookings.has(booking.id) && processingAction[booking.id] === 'accepted' ? 'Aceptando...' : 'Aceptar y Confirmar'}
                      </Button>
                      <Button
                        onClick={() => handleBookingResponse(booking.id, 'rejected')}
                        disabled={loadingBookings.has(booking.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                      >
                        {loadingBookings.has(booking.id) && processingAction[booking.id] === 'rejected' ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <X className="w-4 h-4 mr-2" />
                        )}
                        {loadingBookings.has(booking.id) && processingAction[booking.id] === 'rejected' ? 'Rechazando...' : 'Rechazar'}
                      </Button>
                    </div>
                  )}

                  {/* Response Deadline */}
                  {booking.status === 'pending' && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>
                        Responder antes del: {formatDate(booking.host_response_deadline)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentBookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No has enviado solicitudes
                </h3>
                <p className="text-gray-600">
                  Explora carreras y envía solicitudes de reserva para que aparezcan aquí
                </p>
              </CardContent>
            </Card>
          ) : (
            sentBookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {booking.race?.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Host: {booking.host?.first_name} {booking.host?.last_name}
                      </p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Booking Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{booking.guests_count} {booking.guests_count === 1 ? 'guest' : 'guests'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{booking.property?.locality}</span>
                    </div>
                  </div>

                  {/* Host Response Message */}
                  {booking.host_response_message && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-green-700 mb-1">Respuesta del host:</p>
                      <p className="text-sm text-green-600">{booking.host_response_message}</p>
                    </div>
                  )}

                  {/* Cancel Button for Guest's Pending/Accepted/Confirmed Bookings */}
                  {(['pending', 'accepted', 'confirmed'].includes(booking.status)) && (
                    <div className="flex justify-center pt-2">
                      <Button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={loadingBookings.has(booking.id)}
                        className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                      >
                        {loadingBookings.has(booking.id) && processingAction[booking.id] === 'cancelling' ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <X className="w-4 h-4 mr-2" />
                        )}
                        {loadingBookings.has(booking.id) && processingAction[booking.id] === 'cancelling' ? 'Cancelando...' : 'Cancelar Solicitud'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Guest Info Modal */}
      <GuestInfoModal
        isOpen={showGuestInfoModal}
        onClose={handleCloseGuestModal}
        guestId={selectedGuestId || ''}
      />
    </div>
  );
};

export default BookingsSection;
