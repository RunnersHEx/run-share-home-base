
import { supabase } from "@/integrations/supabase/client";
import { Booking, BookingFormData, BookingFilters, BookingMessage, PointsTransaction, BookingStats } from "@/types/booking";

export class BookingService {
  static async createBookingRequest(bookingData: BookingFormData, guestId: string): Promise<Booking> {
    console.log('BookingService: Creating booking request:', bookingData);
    
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        ...bookingData,
        guest_id: guestId
      })
      .select(`
        *,
        race:races(name, race_date, start_location),
        host:profiles!bookings_host_id_fkey(first_name, last_name, profile_image_url, verification_status, average_rating),
        property:properties(title, locality, max_guests)
      `)
      .single();

    if (error) {
      console.error('BookingService: Error creating booking:', error);
      throw error;
    }

    console.log('BookingService: Created booking successfully:', data);
    return data as Booking;
  }

  static async fetchUserBookings(userId: string, filters?: BookingFilters): Promise<Booking[]> {
    console.log('BookingService: Fetching bookings for user:', userId, 'with filters:', filters);
    
    let query = supabase
      .from('bookings')
      .select(`
        *,
        race:races(name, race_date, start_location),
        guest:profiles!bookings_guest_id_fkey(first_name, last_name, profile_image_url, verification_status, average_rating),
        host:profiles!bookings_host_id_fkey(first_name, last_name, profile_image_url, verification_status, average_rating),
        property:properties(title, locality, max_guests)
      `)
      .or(`guest_id.eq.${userId},host_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.role === 'guest') {
      query = query.eq('guest_id', userId);
    } else if (filters?.role === 'host') {
      query = query.eq('host_id', userId);
    }

    if (filters?.date_range) {
      const now = new Date().toISOString().split('T')[0];
      if (filters.date_range === 'upcoming') {
        query = query.gte('check_in_date', now);
      } else if (filters.date_range === 'past') {
        query = query.lt('check_out_date', now);
      } else if (filters.date_range === 'current') {
        query = query.lte('check_in_date', now).gte('check_out_date', now);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('BookingService: Error fetching bookings:', error);
      throw error;
    }

    console.log('BookingService: Fetched bookings:', data);
    return (data || []) as Booking[];
  }

  static async respondToBooking(bookingId: string, response: 'accepted' | 'rejected', message?: string): Promise<void> {
    console.log('BookingService: Responding to booking:', bookingId, 'with:', response);
    
    const updates: any = {
      status: response,
      host_response_message: message,
      [`${response}_at`]: new Date().toISOString()
    };

    const { error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId);

    if (error) {
      console.error('BookingService: Error updating booking:', error);
      throw error;
    }

    // Si se acepta la reserva, procesar transacción de puntos
    if (response === 'accepted') {
      await this.processBookingPayment(bookingId);
    }

    console.log('BookingService: Booking response updated successfully');
  }

  static async processBookingPayment(bookingId: string): Promise<void> {
    // Obtener datos de la reserva
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('guest_id, host_id, points_cost')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      throw new Error('No se pudo obtener la información de la reserva');
    }

    // Llamar a la función de base de datos para procesar la transacción
    const { error: transactionError } = await supabase.rpc('process_booking_points_transaction', {
      p_booking_id: bookingId,
      p_guest_id: booking.guest_id,
      p_host_id: booking.host_id,
      p_points_cost: booking.points_cost,
      p_transaction_type: 'booking_payment'
    });

    if (transactionError) {
      console.error('BookingService: Error processing payment:', transactionError);
      throw transactionError;
    }
  }

  static async cancelBooking(bookingId: string, refundPoints = false): Promise<void> {
    const updates = {
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId);

    if (error) {
      throw error;
    }

    // Procesar reembolso si es necesario
    if (refundPoints) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('guest_id, host_id, points_cost')
        .eq('id', bookingId)
        .single();

      if (booking) {
        await supabase.rpc('process_booking_points_transaction', {
          p_booking_id: bookingId,
          p_guest_id: booking.guest_id,
          p_host_id: booking.host_id,
          p_points_cost: booking.points_cost,
          p_transaction_type: 'booking_refund'
        });
      }
    }
  }

  static async sendBookingMessage(bookingId: string, senderId: string, message: string): Promise<BookingMessage> {
    const { data, error } = await supabase
      .from('booking_messages')
      .insert({
        booking_id: bookingId,
        sender_id: senderId,
        message: message
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as BookingMessage;
  }

  static async fetchBookingMessages(bookingId: string): Promise<BookingMessage[]> {
    const { data, error } = await supabase
      .from('booking_messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []) as BookingMessage[];
  }

  static async getBookingStats(userId: string): Promise<BookingStats> {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .or(`guest_id.eq.${userId},host_id.eq.${userId}`);

    if (error) {
      throw error;
    }

    const { data: transactions } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', userId);

    const totalBookings = bookings?.length || 0;
    const pendingRequests = bookings?.filter(b => b.status === 'pending').length || 0;
    const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
    
    const pointsEarned = transactions?.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) || 0;
    const pointsSpent = Math.abs(transactions?.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0) || 0);
    
    const hostBookings = bookings?.filter(b => b.host_id === userId) || [];
    const acceptedBookings = hostBookings.filter(b => b.status === 'accepted' || b.status === 'completed');
    const acceptanceRate = hostBookings.length > 0 ? (acceptedBookings.length / hostBookings.length) * 100 : 0;

    return {
      totalBookings,
      pendingRequests,
      completedBookings,
      totalPointsEarned: pointsEarned,
      totalPointsSpent: pointsSpent,
      averageResponseTime: 24, // Placeholder - calcular basado en timestamps reales
      acceptanceRate: Math.round(acceptanceRate)
    };
  }

  static async fetchPointsTransactions(userId: string): Promise<PointsTransaction[]> {
    const { data, error } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []) as PointsTransaction[];
  }

  static async checkUserPointsBalance(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('profiles')
      .select('points_balance')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return data?.points_balance || 0;
  }
}
