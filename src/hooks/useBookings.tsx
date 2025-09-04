
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Booking, BookingFormData, BookingFilters, BookingStats, BookingMessage, PointsTransaction } from "@/types/booking";
import { BookingService } from "@/services/bookingService";
import { supabase } from "@/integrations/supabase/client";

export const useBookings = (filters?: BookingFilters) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<BookingStats>({
    totalBookings: 0,
    pendingRequests: 0,
    completedBookings: 0,
    totalPointsEarned: 0,
    totalPointsSpent: 0,
    averageResponseTime: 0,
    acceptanceRate: 0
  });

  const fetchBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await BookingService.fetchUserBookings(user.id, filters);
      setBookings(data);
    } catch (error) {
      setError('Error al cargar las reservas');
      toast.error('Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      const statsData = await BookingService.getBookingStats(user.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching booking stats:', error);
    }
  };

  const createBookingRequest = async (bookingData: BookingFormData) => {
    if (!user) return null;

    try {
      
      // Verificar balance de puntos
      const balance = await BookingService.checkUserPointsBalance(user.id);
      if (balance < bookingData.points_cost) {
        toast.error('No tienes suficientes puntos para esta reserva');
        return null;
      }

      const data = await BookingService.createBookingRequest(bookingData, user.id);
      
      await fetchBookings();
      await fetchStats();
      toast.success('Solicitud de reserva enviada correctamente');
      return data;
    } catch (error) {
      toast.error('Error al crear la solicitud de reserva');
      return null;
    }
  };

  const respondToBooking = async (bookingId: string, response: 'accepted' | 'rejected', message?: string) => {
    try {
      await BookingService.respondToBooking(bookingId, response, message);
      await fetchBookings();
      await fetchStats();
      
      const responseText = response === 'accepted' ? 'aceptada' : 'rechazada';
      toast.success(`Solicitud ${responseText} correctamente`);
      return true;
    } catch (error) {
      console.error('Error responding to booking:', error);
      toast.error('Error al responder a la solicitud');
      return false;
    }
  };

  const cancelBooking = async (bookingId: string, cancelledBy: 'guest' | 'host' = 'guest', reason?: string) => {
    try {
      // Find the booking
      const booking = bookings?.find(b => b.id === bookingId);
      if (!booking) {
        toast.error('Reserva no encontrada');
        return false;
      }

      // Show appropriate warning based on cancellation policy
      const now = new Date();
      const checkInDate = new Date(booking.check_in_date);
      const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let warningMessage = '';
      
      if (cancelledBy === 'guest' && daysUntilCheckIn < 7) {
        warningMessage = 'Cancelación tardía: no se reembolsarán los puntos.';
      } else if (cancelledBy === 'host') {
        const penaltyPoints = booking.points_cost || 100;
        warningMessage = `Cancelación de host: se aplicará una penalización de ${penaltyPoints} puntos.`;
      }
      
      // Show warning if applicable
      if (warningMessage) {
        const confirmed = window.confirm(`${warningMessage} ¿Continuar con la cancelación?`);
        if (!confirmed) return false;
      }
      
      // Call the service to cancel (database triggers will handle points automatically)
      await BookingService.cancelBooking(bookingId, cancelledBy, reason);
      
      await fetchBookings();
      await fetchStats();
      
      toast.success('Reserva cancelada correctamente');
      return true;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Error al cancelar la reserva');
      return false;
    }
  };

  const confirmBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;
      
      await fetchBookings();
      await fetchStats();
      toast.success('Reserva confirmada');
      return true;
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error('Error al confirmar la reserva');
      return false;
    }
  };

  const completeBooking = async (bookingId: string) => {
    try {
      // Find the booking to get guest information
      const booking = bookings?.find(b => b.id === bookingId);
      if (!booking) {
        toast.error('Reserva no encontrada');
        return false;
      }

      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;
      
      // Send notification to guest about experience completion
      try {
        const { NotificationService } = await import('@/services/notificationService');
        await NotificationService.createNotification({
          user_id: booking.guest_id,
          type: 'booking_completed',
          title: 'Experiencia completada',
          message: 'Experiencia completada. Visita la sección de reseñas para calificar a tu anfitrión',
          data: {
            booking_id: bookingId,
            host_name: `${booking.host?.first_name || ''} ${booking.host?.last_name || ''}`.trim(),
            property_title: booking.property?.title,
            race_name: booking.race?.name,
            completion_date: new Date().toISOString()
          }
        });
      } catch (notificationError) {
        console.error('Error sending completion notification to guest:', notificationError);
        // Don't fail the booking completion if notification fails
      }
      
      await fetchBookings();
      await fetchStats();
      toast.success('Reserva completada');
      return true;
    } catch (error) {
      console.error('Error completing booking:', error);
      toast.error('Error al completar la reserva');
      return false;
    }
  };

  const getBookingsByStatus = (status: string) => {
    return bookings?.filter(b => b.status === status) || [];
  };

  const getPendingHostRequests = () => {
    return bookings?.filter(
      b => b.status === 'pending' && b.host_id === user?.id
    ) || [];
  };

  const getUpcomingBookings = () => {
    const today = new Date().toISOString().split('T')[0];
    return bookings?.filter(
      b => ['accepted', 'confirmed'].includes(b.status) && b.check_in_date >= today
    ) || [];
  };

  // Auto-refresh bookings every 5 minutes for real-time updates
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchBookings();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (user) {
      console.log('useBookings: User detected, fetching bookings');
      fetchBookings();
      fetchStats();
    }
  }, [user, filters]);

  return {
    bookings,
    loading,
    error,
    stats,
    createBookingRequest,
    respondToBooking,
    cancelBooking,
    confirmBooking,
    completeBooking,
    refetchBookings: fetchBookings,
    getBookingsByStatus,
    getPendingHostRequests,
    getUpcomingBookings
  };
};

export const useBookingMessages = (bookingId: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    if (!bookingId) return;

    try {
      const data = await BookingService.fetchBookingMessages(bookingId);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message: string) => {
    if (!user) return null;

    try {
      const data = await BookingService.sendBookingMessage(bookingId, user.id, message);
      await fetchMessages();
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar el mensaje');
      return null;
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchMessages();
    }
  }, [bookingId]);

  return {
    messages,
    loading,
    sendMessage,
    refetchMessages: fetchMessages
  };
};

export const usePointsTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const data = await BookingService.fetchPointsTransactions(user.id);
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  return {
    transactions,
    loading,
    refetchTransactions: fetchTransactions
  };
};
