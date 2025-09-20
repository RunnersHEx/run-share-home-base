import { supabase } from "@/integrations/supabase/client";
import { Booking, BookingFormData, BookingFilters, BookingMessage, PointsTransaction, BookingStats } from "@/types/booking";
import { NotificationService } from "./notificationService";
import { PointsCalculationService } from "./pointsCalculationService";
import { PointsManagementService } from "./pointsManagementService";

export class BookingService {
  static async createBookingRequest(bookingData: BookingFormData, guestId: string): Promise<Booking> {
    console.log('Creating booking request:', bookingData);
    
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

    // Calculate booking cost using provincial points system
    const calculatedCost = await PointsCalculationService.calculateProvincialBookingCost({
      raceId: bookingData.race_id,
      checkInDate: bookingData.check_in_date,
      checkOutDate: bookingData.check_out_date
    });

    // Check if guest has sufficient points
    const hasSufficientPoints = await PointsManagementService.validateSufficientPoints(guestId, calculatedCost);
    if (!hasSufficientPoints) {
      throw new Error(`Insufficient points. Required: ${calculatedCost}, but you need more points to complete this booking.`);
    }

    // Create insert data
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
      points_cost: calculatedCost, // Use calculated cost from provincial system
      // Add required field with placeholder - will be overwritten by trigger
      host_response_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    };
    
    console.log('Inserting booking with calculated cost:', calculatedCost);

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
      console.error('Error creating booking:', error);
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
    console.log('Fetching bookings for user:', userId, 'with filters:', filters);
    
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
    console.log('Responding to booking:', bookingId, 'with response:', response);
    
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

    // Process response-specific actions
    if (response === 'accepted') {
      // Process booking payment using new points management system
      await this.processBookingPayment(bookingId);
      
      // Lock availability for these dates
      if (updatedBooking) {
        await this.lockPropertyAvailability(updatedBooking);
        // Also mark the race as unavailable since it's been booked
        await this.markRaceAsUnavailable(updatedBooking.race_id);
      }
      
      // Create conversation between guest and host
      if (updatedBooking) {
        try {
          await this.createConversationForBooking(updatedBooking);
        } catch (conversationError) {
          console.error('Error creating conversation for booking:', conversationError);
          // Don't fail the booking acceptance if conversation creation fails
        }
      }
      
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
    console.log('Processing booking payment for:', bookingId);
    
    // Get booking data
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('guest_id, host_id, points_cost, race_id, check_in_date, check_out_date')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      throw new Error('Could not retrieve booking information');
    }

    // Use the new points management service for processing payment
    await PointsManagementService.processBookingPayment({
      bookingId,
      guestId: booking.guest_id,
      hostId: booking.host_id,
      raceId: booking.race_id,
      checkInDate: booking.check_in_date,
      checkOutDate: booking.check_out_date
    });

    console.log('Booking payment processed successfully');
  }

  static async cancelBooking(bookingId: string, cancelledBy: 'guest' | 'host', reason?: string): Promise<void> {
    console.log('Cancelling booking:', bookingId, 'cancelled by:', cancelledBy);
    
    // Get booking data first
    const { data: booking, error: fetchError } = await supabase
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

    if (fetchError || !booking) {
      throw new Error('Booking not found');
    }

    // Update booking status with cancellation details
    const updates = {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy,
      cancellation_reason: reason || `Cancelled by ${cancelledBy}`
    };

    const { error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId);

    if (error) {
      throw error;
    }

    // Handle points based on who cancelled
    if (cancelledBy === 'host') {
      // Host cancellation penalty will be handled automatically by database trigger
      // Remove manual RPC call to prevent double processing
      console.log('Host cancellation - penalty will be applied by database trigger automatically');
    } else if (cancelledBy === 'guest') {
      // Guest cancellation refund will be handled automatically by database trigger  
      // Remove manual RPC call to prevent double processing
      console.log('Guest cancellation - refund policy will be applied by database trigger automatically');
    }

    // Release availability if booking was accepted
    if (booking.status === 'accepted' || booking.status === 'confirmed') {
      await this.releasePropertyAvailability(booking);
      // Also mark the race as available again
      await this.markRaceAsAvailable(booking.race_id);
    }

    // Block messaging for safety
    await this.blockConversationMessaging(bookingId, `Booking cancelled by ${cancelledBy}`);

    // Send cancellation notifications
    try {
      await NotificationService.notifyBookingCancelled(booking, cancelledBy, 0);
    } catch (notifError) {
      console.error('Error sending cancellation notification:', notifError);
    }

    console.log('Booking cancellation processed successfully');
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

    // Use the new points management service for statistics
    const pointsSummary = await PointsManagementService.getUserPointsSummary(userId);

    const totalBookings = bookings?.length || 0;
    const pendingRequests = bookings?.filter(b => b.status === 'pending').length || 0;
    const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
    
    const hostBookings = bookings?.filter(b => b.host_id === userId) || [];
    const acceptedBookings = hostBookings.filter(b => b.status === 'accepted' || b.status === 'completed');
    const acceptanceRate = hostBookings.length > 0 ? (acceptedBookings.length / hostBookings.length) * 100 : 0;

    return {
      totalBookings,
      pendingRequests,
      completedBookings,
      totalPointsEarned: pointsSummary.total_earned,
      totalPointsSpent: pointsSummary.total_spent,
      averageResponseTime: 24, // Calculate based on actual timestamps
      acceptanceRate: Math.round(acceptanceRate)
    };
  }

  static async fetchPointsTransactions(userId: string): Promise<PointsTransaction[]> {
    // Use the new points management service
    return await PointsManagementService.getUserPointsHistory(userId);
  }

  static async checkUserPointsBalance(userId: string): Promise<number> {
    // Use the new points calculation service
    return await PointsCalculationService.getUserPointsBalance(userId);
  }

  /**
   * Get booking cost estimate using provincial points system
   */
  static async getBookingCostEstimate(raceId: string, checkInDate: string, checkOutDate: string): Promise<number> {
    return await PointsCalculationService.calculateProvincialBookingCost({
      raceId,
      checkInDate,
      checkOutDate
    });
  }

  /**
   * Creates a conversation between guest and host for an accepted booking
   */
  static async createConversationForBooking(booking: any): Promise<void> {
    try {
      console.log('Creating conversation for booking:', booking.id);

      // Create new conversation directly - the database will handle uniqueness with the UNIQUE constraint
      // This avoids the RLS policy check that was causing the 406 error
      const conversationData: any = {
        booking_id: booking.id,
        participant_1_id: booking.guest_id,
        participant_2_id: booking.host_id,
        last_message_at: new Date().toISOString()
      };
      
      // Add optional fields
      conversationData.last_message = '¡Reserva aceptada! Ahora pueden empezar a comunicarse.';
      conversationData.unread_count_p1 = 0;
      conversationData.unread_count_p2 = 0;

      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert(conversationData)
        .select('id')
        .single();

      if (createError) {
        // Check if error is due to conversation already existing (unique constraint violation)
        if (createError.code === '23505') {
          console.log('Conversation already exists for booking:', booking.id);
          return;
        }
        
        console.error('Error creating conversation:', createError);
        throw createError;
      }

      // Send initial system message to both participants
      const welcomeMessage = `¡Buenas noticias! Tu reserva ha sido aceptada. Ahora pueden comunicarse directamente entre ustedes para coordinar los detalles del check-in y resolver cualquier duda sobre la estancia.

**Directrices de mensajería**

**Para huéspedes:**
• Sé respetuoso y comunica con claridad
• Indica con precisión tu hora de llegada
• Haz preguntas sobre la propiedad o la zona
• Confirma los detalles del check-in con tu anfitrión

**Para anfitriones:**
• Responde con prontitud a los mensajes de los huéspedes
• Facilita información útil sobre actividades locales
• Comparte las instrucciones de check-in de forma clara
• Sé acogedor y profesional`;
      
      // Prepare message data
      const messageData: any = {
        booking_id: booking.id,
        sender_id: booking.host_id, // System message from host
        message: welcomeMessage,
        message_type: 'system'
      };
      
      // Add conversation_id if available
      if (newConversation?.id) {
        messageData.conversation_id = newConversation.id;
      }
      
      const { error: messageError } = await supabase
        .from('booking_messages')
        .insert(messageData);

      if (messageError) {
        console.error('Error creating welcome message:', messageError);
        // Don't throw error - conversation creation was successful
      }

      console.log('Successfully created conversation for booking:', booking.id);
    } catch (error) {
      console.error('Error in createConversationForBooking:', error);
      // Don't throw error to avoid breaking booking acceptance
      // Log it for debugging but let the booking acceptance continue
    }
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
   * Marks a race as unavailable when a booking is accepted
   */
  private static async markRaceAsUnavailable(raceId: string): Promise<void> {
    try {
      console.log('Marking race as unavailable:', raceId);
      
      // First check if the is_available_for_booking column exists
      const { data: raceCheck } = await supabase
        .from('races')
        .select('id, is_available_for_booking')
        .eq('id', raceId)
        .limit(1)
        .single();
      
      let updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      // Only update is_available_for_booking if the column exists
      if (raceCheck && 'is_available_for_booking' in raceCheck) {
        updateData.is_available_for_booking = false;
      }
      
      const { error } = await supabase
        .from('races')
        .update(updateData)
        .eq('id', raceId);

      if (error) {
        console.error('Error marking race as unavailable:', error);
      } else {
        console.log('Successfully marked race as unavailable:', raceId);
      }
    } catch (error) {
      console.error('Error in markRaceAsUnavailable:', error);
    }
  }

  /**
   * Blocks messaging for a conversation when booking is cancelled
   */
  static async blockConversationMessaging(bookingId: string, reason?: string): Promise<void> {
    try {
      console.log('Blocking messaging for booking:', bookingId);
      
      // Block messaging using the database function
      const { error } = await supabase.rpc('block_conversation_messaging', {
        p_booking_id: bookingId,
        p_reason: reason || 'Booking cancelled - messaging blocked for safety'
      });
      
      if (error) {
        console.error('Error blocking conversation messaging:', error);
        // Don't throw error - this is a safety feature but shouldn't break the cancellation
      } else {
        console.log('Successfully blocked messaging for booking:', bookingId);
      }
    } catch (error) {
      console.error('Error in blockConversationMessaging:', error);
      // Don't throw error - this is a safety feature but shouldn't break the cancellation
    }
  }

  /**
   * Checks if messaging is blocked for a booking
   */
  static async isMessagingBlocked(bookingId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_messaging_blocked', {
        p_booking_id: bookingId
      });
      
      if (error) {
        console.error('Error checking if messaging is blocked:', error);
        return false; // Default to not blocked if there's an error
      }
      
      return data || false;
    } catch (error) {
      console.error('Error in isMessagingBlocked:', error);
      return false;
    }
  }

  /**
   * Marks a race as available when a booking is cancelled
   */
  private static async markRaceAsAvailable(raceId: string): Promise<void> {
    try {
      console.log('Marking race as available:', raceId);
      
      // First check if the is_available_for_booking column exists
      const { data: raceCheck } = await supabase
        .from('races')
        .select('id, is_available_for_booking')
        .eq('id', raceId)
        .limit(1)
        .single();
      
      let updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      // Only update is_available_for_booking if the column exists
      if (raceCheck && 'is_available_for_booking' in raceCheck) {
        updateData.is_available_for_booking = true;
      }
      
      const { error } = await supabase
        .from('races')
        .update(updateData)
        .eq('id', raceId);

      if (error) {
        console.error('Error marking race as available:', error);
      } else {
        console.log('Successfully marked race as available:', raceId);
      }
    } catch (error) {
      console.error('Error in markRaceAsAvailable:', error);
    }
  }
}
