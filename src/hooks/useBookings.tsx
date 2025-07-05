
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Booking, BookingFormData, BookingFilters, BookingStats, BookingMessage, PointsTransaction } from "@/types/booking";
import { BookingService } from "@/services/bookingService";

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
      console.log('Fetching bookings for user:', user.id);
      const data = await BookingService.fetchUserBookings(user.id, filters);
      console.log('Fetched bookings:', data);
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
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
      console.log('Creating booking request:', bookingData);
      
      // Verificar balance de puntos
      const balance = await BookingService.checkUserPointsBalance(user.id);
      if (balance < bookingData.points_cost) {
        toast.error('No tienes suficientes puntos para esta reserva');
        return null;
      }

      const data = await BookingService.createBookingRequest(bookingData, user.id);
      console.log('Created booking request:', data);
      
      await fetchBookings();
      await fetchStats();
      toast.success('Solicitud de reserva enviada correctamente');
      return data;
    } catch (error) {
      console.error('Error creating booking request:', error);
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

  const cancelBooking = async (bookingId: string, refundPoints = false) => {
    try {
      await BookingService.cancelBooking(bookingId, refundPoints);
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
    refetchBookings: fetchBookings
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
