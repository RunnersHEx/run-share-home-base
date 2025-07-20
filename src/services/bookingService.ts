import { supabase } from "@/integrations/supabase/client";
import { Booking, BookingFormData, BookingFilters, BookingMessage, PointsTransaction, BookingStats } from "@/types/booking";
import { NotificationService } from "./notificationService";

export class BookingService {
  static async createBookingRequest(bookingData: BookingFormData, guestId: string): Promise<Booking> {

    
    // Validate required fields
    if (!bookingData.race_id || !bookingData.host_id) {
      throw new Error('Missing required IDs: race_id or host_id');
    }
    
    if (!bookingData.check_in_date || !bookingData.check_out_date) {
      throw new Error('Missing required dates: check_in_date or check_out_date');
    }
    
    // If property_id is the same as host_id, we need to find the actual property
    let actualPropertyId = bookingData.property_id;
    
    if (actualPropertyId === bookingData.host_id) {
      // Look up the host's property
      const { data: hostProperty, error: propertyError } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', bookingData.host_id)
        .eq('is_active', true)
        .limit(1)
        .single();
      
      if (propertyError || !hostProperty) {
        throw new Error('No active property found for this host. Please contact support.');
      }
      
      actualPropertyId = hostProperty.id;
    }
    
    // Create insert data without host_response_deadline (handled by trigger)
    const insertData = {
      race_id: bookingData.race_id,
      property_id: actualPropertyId,
      host_id: bookingData.host_id,
      guest_id: guestId,
      check_in_date: bookingData.check_in_date,
      check_out_date: bookingData.check_out_date,
      guests_count: bookingData.guests_count,
      request_message: bookingData.request_message,
      special_requests: bookingData.special_requests,
      guest_phone: bookingData.guest_phone,
      estimated_arrival_time: bookingData.estimated_arrival_time,
      points_cost: bookingData.points_cost,
      // Add required field with placeholder - will be overwritten by trigger
      host_response_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    };
    


    const { data, error } = await supabase
      .from('bookings')
      .insert(insertData)
      .select(`
        *,
        race:races(name, race_date, start_location),
        guest:profiles!bookings_guest_id_profiles_fkey(first_name, last_name, profile_image_url),
        host:profiles!bookings_host_id_profiles_fkey(first_name, last_name, profile_image_url, verification_status, average_rating),
        property:properties(title, locality, max_guests)
      `)
      .single();

    if (error) {
      throw error;
    }
    
    if (!data) {
      throw new Error('No data returned from booking creation');
    }
    
    // Send notification to host about new booking request
    try {
      await NotificationService.notifyNewBookingRequest(data);
    } catch (notifError) {
      console.error('Error sending booking request notification:', notifError);
      // Don't fail the booking creation if notification fails
    }
    
    return data as unknown as Booking;
  }

  static async fetchUserBookings(userId: string, filters?: BookingFilters): Promise<Booking[]> {

    
    let query = supabase
      .from('bookings')
      .select(`
        *,
        race:races(name, race_date, start_location),
        guest:profiles!bookings_guest_id_profiles_fkey(first_name, last_name, profile_image_url, verification_status, average_rating),
        host:profiles!bookings_host_id_profiles_fkey(first_name, last_name, profile_image_url, verification_status, average_rating),
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


    return (data || []) as unknown as Booking[];
  }

  static async respondToBooking(bookingId: string, response: 'accepted' | 'rejected', message?: string): Promise<void> {

    
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

    // Get updated booking with related data for notifications
    const { data: updatedBooking } = await supabase
      .from('bookings')
      .select(`
        *,
        race:races(name, race_date),
        guest:profiles!bookings_guest_id_profiles_fkey(first_name, last_name, profile_image_url),
        host:profiles!bookings_host_id_profiles_fkey(first_name, last_name, profile_image_url),
        property:properties(title, locality)
      `)
      .eq('id', bookingId)
      .single();

    // Si se acepta la reserva, procesar transacción de puntos
    if (response === 'accepted') {
      await this.processBookingPayment(bookingId);
      
      // Lock availability for these dates
      await this.lockPropertyAvailability(updatedBooking);
      
      // Send acceptance notifications
      if (updatedBooking) {
        try {
          await NotificationService.notifyBookingAccepted(updatedBooking);
        } catch (notifError) {
          console.error('Error sending booking acceptance notification:', notifError);
        }
      }
    } else if (response === 'rejected') {
      // Send rejection notification
      if (updatedBooking) {
        try {
          await NotificationService.notifyBookingRejected(updatedBooking);
        } catch (notifError) {
          console.error('Error sending booking rejection notification:', notifError);
        }
      }
    }


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

  static async cancelBooking(bookingId: string, cancelledBy: 'guest' | 'host', refundPoints = false): Promise<void> {
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

    // Get booking data for notifications and penalties
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        race:races(name, race_date),
        guest:profiles!bookings_guest_id_profiles_fkey(first_name, last_name),
        host:profiles!bookings_host_id_profiles_fkey(first_name, last_name),
        property:properties(title)
      `)
      .eq('id', bookingId)
      .single();

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Calculate penalties based on timing and who cancelled
    let penalty = 0;
    const now = new Date();
    const checkInDate = new Date(booking.check_in_date);
    const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (cancelledBy === 'host' && daysUntilCheckIn < 60) {
      // Host cancels less than 60 days before: -30 points penalty
      penalty = 30;
      await this.applyPenalty(booking.host_id, penalty, 'host_cancellation');
    } else if (cancelledBy === 'guest' && daysUntilCheckIn < 7) {
      // Guest cancels less than 7 days before: lose points
      penalty = booking.points_cost;
      refundPoints = false; // No refund for late guest cancellation
    }

    // Procesar reembolso si es necesario
    if (refundPoints) {
      await supabase.rpc('process_booking_points_transaction', {
        p_booking_id: bookingId,
        p_guest_id: booking.guest_id,
        p_host_id: booking.host_id,
        p_points_cost: booking.points_cost,
        p_transaction_type: 'booking_refund'
      });
    }

    // Release availability if was accepted
    if (booking.status === 'accepted' || booking.status === 'confirmed') {
      await this.releasePropertyAvailability(booking);
    }

    // Send cancellation notifications
    try {
      await NotificationService.notifyBookingCancelled(booking, cancelledBy, penalty);
    } catch (notifError) {
      console.error('Error sending cancellation notification:', notifError);
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

  /**
   * Locks property availability for accepted booking dates
   */
  private static async lockPropertyAvailability(booking: any): Promise<void> {
    try {
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      const datesToBlock = [];

      // Generate all dates between check-in and check-out
      for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
        datesToBlock.push({
          property_id: booking.property_id,
          date: d.toISOString().split('T')[0],
          status: 'reserved',
          notes: `Reserved for booking ${booking.id}`
        });
      }

      if (datesToBlock.length > 0) {
        await supabase
          .from('property_availability')
          .upsert(datesToBlock, { onConflict: 'property_id,date' });
      }
    } catch (error) {
      console.error('Error locking property availability:', error);
    }
  }

  /**
   * Releases property availability when booking is cancelled
   */
  private static async releasePropertyAvailability(booking: any): Promise<void> {
    try {
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      const datesToRelease = [];

      // Generate all dates between check-in and check-out
      for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
        datesToRelease.push(d.toISOString().split('T')[0]);
      }

      if (datesToRelease.length > 0) {
        await supabase
          .from('property_availability')
          .update({ status: 'available', notes: null })
          .eq('property_id', booking.property_id)
          .in('date', datesToRelease);
      }
    } catch (error) {
      console.error('Error releasing property availability:', error);
    }
  }

  /**
   * Applies penalty points to a user
   */
  private static async applyPenalty(userId: string, penaltyPoints: number, reason: string): Promise<void> {
    try {
      await supabase.rpc('process_penalty_transaction', {
        p_user_id: userId,
        p_penalty_points: penaltyPoints,
        p_reason: reason
      });
    } catch (error) {
      console.error('Error applying penalty:', error);
    }
  }
}
