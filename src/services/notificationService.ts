import { supabase } from "@/integrations/supabase/client";

export interface NotificationData {
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

export class NotificationService {
  // Notification types
  static readonly TYPES = {
    BOOKING_REQUEST_RECEIVED: 'booking_request_received',
    BOOKING_DEADLINE_REMINDER: 'booking_deadline_reminder',
    BOOKING_ACCEPTED: 'booking_accepted',
    BOOKING_REJECTED: 'booking_rejected',
    BOOKING_CONFIRMED: 'booking_confirmed',
    BOOKING_COMPLETED: 'booking_completed',
    BOOKING_CANCELLED: 'booking_cancelled',
    REVIEW_PROMPT: 'review_prompt',
    CANCELLATION_PENALTY: 'cancellation_penalty',
    ACCOUNT_ACTIVATED: 'account_activated',
    ACCOUNT_DEACTIVATED: 'account_deactivated',
    NEW_USER_REGISTERED: 'new_user_registered',
    VERIFICATION_DOCUMENTS_SUBMITTED: 'verification_documents_submitted'
  };

  /**
   * Creates a notification for a user using direct table insert
   */
  static async createNotification(notificationData: NotificationData): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .insert({
          user_id: notificationData.user_id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data || {}
        });

      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }

      console.log('Notification created successfully:', data);
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Sends notification when user account is activated
   */
  static async notifyAccountActivated(userId: string, adminName?: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: this.TYPES.ACCOUNT_ACTIVATED,
      title: 'Cuenta activada',
      message: `Tu cuenta ha sido reactivada por ${adminName || 'el administrador'}. Ya puedes acceder a todas las funcionalidades de la plataforma.`,
      data: {
        admin_name: adminName,
        activation_date: new Date().toISOString()
      }
    });
  }

  /**
   * Sends notification when user account is deactivated
   */
  static async notifyAccountDeactivated(userId: string, reason?: string, adminName?: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: this.TYPES.ACCOUNT_DEACTIVATED,
      title: 'Cuenta desactivada',
      message: `Tu cuenta ha sido desactivada por ${adminName || 'el administrador'}. ${reason ? `Motivo: ${reason}` : ''} Revisa los mensajes del administrador para más información.`,
      data: {
        admin_name: adminName,
        reason: reason,
        deactivation_date: new Date().toISOString()
      }
    });
  }

  /**
   * Sends notification when a new booking request is received
   */
  static async notifyNewBookingRequest(booking: any): Promise<void> {
    await this.createNotification({
      user_id: booking.host_id,
      type: this.TYPES.BOOKING_REQUEST_RECEIVED,
      title: 'Nueva solicitud de reserva',
      message: `${booking.guest?.first_name} ${booking.guest?.last_name} ha solicitado reservar tu propiedad para ${booking.race?.name}`,
      data: {
        booking_id: booking.id,
        guest_name: `${booking.guest?.first_name} ${booking.guest?.last_name}`,
        race_name: booking.race?.name,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        points_cost: booking.points_cost,
        deadline: booking.host_response_deadline
      }
    });
  }

  /**
   * Sends deadline reminder notifications (24h before expiry)
   */
  static async notifyDeadlineReminder(booking: any): Promise<void> {
    const hoursRemaining = Math.ceil(
      (new Date(booking.host_response_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60)
    );

    await this.createNotification({
      user_id: booking.host_id,
      type: this.TYPES.BOOKING_DEADLINE_REMINDER,
      title: 'Recordatorio: Solicitud por expirar',
      message: `Tienes ${hoursRemaining} horas para responder a la solicitud de ${booking.guest?.first_name} ${booking.guest?.last_name}`,
      data: {
        booking_id: booking.id,
        guest_name: `${booking.guest?.first_name} ${booking.guest?.last_name}`,
        hours_remaining: hoursRemaining,
        deadline: booking.host_response_deadline
      }
    });
  }

  /**
   * Sends notification when booking is accepted
   */
  static async notifyBookingAccepted(booking: any): Promise<void> {
    // Notify guest
    await this.createNotification({
      user_id: booking.guest_id,
      type: this.TYPES.BOOKING_ACCEPTED,
      title: '¡Solicitud aceptada!',
      message: `Tu solicitud para ${booking.race?.name} ha sido aceptada por ${booking.host?.first_name}`,
      data: {
        booking_id: booking.id,
        host_name: `${booking.host?.first_name} ${booking.host?.last_name}`,
        race_name: booking.race?.name,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        host_response_message: booking.host_response_message
      }
    });

    // Notify host
    await this.createNotification({
      user_id: booking.host_id,
      type: this.TYPES.BOOKING_ACCEPTED,
      title: 'Reserva confirmada',
      message: `Has aceptado la solicitud de ${booking.guest?.first_name} ${booking.guest?.last_name}`,
      data: {
        booking_id: booking.id,
        guest_name: `${booking.guest?.first_name} ${booking.guest?.last_name}`,
        race_name: booking.race?.name,
        points_earned: booking.points_cost
      }
    });
  }

  /**
   * Sends notification when booking is rejected
   */
  static async notifyBookingRejected(booking: any): Promise<void> {
    await this.createNotification({
      user_id: booking.guest_id,
      type: this.TYPES.BOOKING_REJECTED,
      title: 'Solicitud rechazada',
      message: `Tu solicitud para ${booking.race?.name} ha sido rechazada`,
      data: {
        booking_id: booking.id,
        host_name: `${booking.host?.first_name} ${booking.host?.last_name}`,
        race_name: booking.race?.name,
        host_response_message: booking.host_response_message,
        points_refunded: booking.points_cost
      }
    });
  }

  /**
   * Sends notification when booking is confirmed (check-in date)
   */
  static async notifyBookingConfirmed(booking: any): Promise<void> {
    // Notify both guest and host
    const notifications = [
      {
        user_id: booking.guest_id,
        type: this.TYPES.BOOKING_CONFIRMED,
        title: 'Check-in confirmado',
        message: `Tu estancia en ${booking.property?.title} ha comenzado. ¡Disfruta tu carrera!`,
        data: {
          booking_id: booking.id,
          property_title: booking.property?.title,
          race_name: booking.race?.name,
          host_contact: booking.host?.phone
        }
      },
      {
        user_id: booking.host_id,
        type: this.TYPES.BOOKING_CONFIRMED,
        title: 'Huésped en propiedad',
        message: `${booking.guest?.first_name} ${booking.guest?.last_name} ha hecho check-in`,
        data: {
          booking_id: booking.id,
          guest_name: `${booking.guest?.first_name} ${booking.guest?.last_name}`,
          guest_contact: booking.guest_phone
        }
      }
    ];

    for (const notification of notifications) {
      await this.createNotification(notification);
    }
  }

  /**
   * Sends notification when booking is completed
   */
  static async notifyBookingCompleted(booking: any): Promise<void> {
    // Notify both parties and prompt for reviews
    const notifications = [
      {
        user_id: booking.guest_id,
        type: this.TYPES.BOOKING_COMPLETED,
        title: 'Estancia completada',
        message: `Tu estancia ha terminado. ¡Esperamos que hayas disfrutado la experiencia!`,
        data: {
          booking_id: booking.id,
          property_title: booking.property?.title,
          race_name: booking.race?.name
        }
      },
      {
        user_id: booking.host_id,
        type: this.TYPES.BOOKING_COMPLETED,
        title: 'Reserva finalizada',
        message: `La estancia de ${booking.guest?.first_name} ${booking.guest?.last_name} ha terminado`,
        data: {
          booking_id: booking.id,
          guest_name: `${booking.guest?.first_name} ${booking.guest?.last_name}`,
          points_earned: booking.points_cost
        }
      }
    ];

    for (const notification of notifications) {
      await this.createNotification(notification);
    }

    // Send review prompts after a short delay
    setTimeout(() => {
      this.notifyReviewPrompt(booking);
    }, 2 * 60 * 60 * 1000); // 2 hours delay
  }

  /**
   * Sends review prompt notifications
   */
  static async notifyReviewPrompt(booking: any): Promise<void> {
    const notifications = [
      {
        user_id: booking.guest_id,
        type: this.TYPES.REVIEW_PROMPT,
        title: 'Deja tu reseña',
        message: `¿Cómo fue tu experiencia en ${booking.property?.title}? Tu opinión ayuda a la comunidad`,
        data: {
          booking_id: booking.id,
          host_name: `${booking.host?.first_name} ${booking.host?.last_name}`,
          property_title: booking.property?.title,
          review_type: 'guest_to_host'
        }
      },
      {
        user_id: booking.host_id,
        type: this.TYPES.REVIEW_PROMPT,
        title: 'Califica a tu huésped',
        message: `¿Cómo fue tu experiencia con ${booking.guest?.first_name}? Deja tu reseña`,
        data: {
          booking_id: booking.id,
          guest_name: `${booking.guest?.first_name} ${booking.guest?.last_name}`,
          review_type: 'host_to_guest'
        }
      }
    ];

    for (const notification of notifications) {
      await this.createNotification(notification);
    }
  }

  /**
   * Sends cancellation notifications
   */
  static async notifyBookingCancelled(booking: any, cancelledBy: 'guest' | 'host', penalty?: number): Promise<void> {
    const isGuestCancellation = cancelledBy === 'guest';
    const recipientId = isGuestCancellation ? booking.host_id : booking.guest_id;
    const cancellerName = isGuestCancellation 
      ? `${booking.guest?.first_name} ${booking.guest?.last_name}`
      : `${booking.host?.first_name} ${booking.host?.last_name}`;

    await this.createNotification({
      user_id: recipientId,
      type: this.TYPES.BOOKING_CANCELLED,
      title: 'Reserva cancelada',
      message: `${cancellerName} ha cancelado la reserva para ${booking.race?.name}`,
      data: {
        booking_id: booking.id,
        cancelled_by: cancelledBy,
        canceller_name: cancellerName,
        race_name: booking.race?.name,
        penalty: penalty || 0
      }
    });

    // Notify canceller about penalty if applicable
    if (penalty && penalty > 0) {
      const cancellerId = isGuestCancellation ? booking.guest_id : booking.host_id;
      await this.createNotification({
        user_id: cancellerId,
        type: this.TYPES.CANCELLATION_PENALTY,
        title: 'Penalización por cancelación',
        message: `Se ha aplicado una penalización de ${penalty} puntos por cancelación tardía`,
        data: {
          booking_id: booking.id,
          penalty_points: penalty,
          reason: isGuestCancellation ? 'Cancelación tardía de huésped' : 'Cancelación de host'
        }
      });
    }
  }

  /**
   * Gets all unread notifications for a user
   */
  static async getUnreadNotifications(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }

  /**
   * Marks a notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  /**
   * Marks all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  /**
   * Gets all admin users based on their email addresses
   */
  static async getAdminUsers(): Promise<any[]> {
    try {
      const adminEmails = [
        'runnershomeexchange@gmail.com',
        'admin@mail.com'
      ];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('email', adminEmails);

      if (error) {
        console.error('Error fetching admin users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch admin users:', error);
      return [];
    }
  }

  /**
   * Sends notification to all admin users when a new user registers
   */
  static async notifyNewUserRegistered(newUser: any): Promise<void> {
    try {
      const adminUsers = await this.getAdminUsers();
      
      if (adminUsers.length === 0) {
        console.warn('No admin users found to notify about new user registration');
        return;
      }

      const userName = `${newUser.first_name || ''} ${newUser.last_name || ''}`.trim() || 'Usuario sin nombre';
      const userEmail = newUser.email || 'Email no especificado';
      
      // Send notification to each admin
      const notifications = adminUsers.map(admin => ({
        user_id: admin.id,
        type: this.TYPES.NEW_USER_REGISTERED,
        title: 'Nuevo usuario registrado',
        message: `${userName} (${userEmail}) ha sido registrado`,
        data: {
          new_user_id: newUser.id,
          new_user_email: userEmail,
          new_user_name: userName,
          registration_date: new Date().toISOString(),
          verification_status: newUser.verification_status || 'unverified'
        }
      }));

      // Create all notifications
      for (const notification of notifications) {
        await this.createNotification(notification);
      }

      console.log(`Notified ${adminUsers.length} admin(s) about new user registration: ${userName}`);
    } catch (error) {
      console.error('Failed to notify admins about new user registration:', error);
      // Don't throw error - user registration should not fail because of notification issues
    }
  }

  /**
   * Sends notification to all admin users when a user submits verification documents
   */
  static async notifyVerificationDocumentsSubmitted(user: any): Promise<void> {
    try {
      const adminUsers = await this.getAdminUsers();
      
      if (adminUsers.length === 0) {
        console.warn('No admin users found to notify about verification documents submission');
        return;
      }

      const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Usuario sin nombre';
      const userEmail = user.email || 'Email no especificado';
      const documentCount = user.verification_documents?.length || 0;
      
      // Send notification to each admin
      const notifications = adminUsers.map(admin => ({
        user_id: admin.id,
        type: this.TYPES.VERIFICATION_DOCUMENTS_SUBMITTED,
        title: 'Documentos de verificación pendientes',
        message: `${userName} (${userEmail}) ha subido ${documentCount} documento(s) de verificación y está pendiente de revisión`,
        data: {
          user_id: user.id,
          user_email: userEmail,
          user_name: userName,
          document_count: documentCount,
          submission_date: new Date().toISOString(),
          verification_status: user.verification_status || 'pending',
          verification_documents: user.verification_documents || []
        }
      }));

      // Create all notifications
      for (const notification of notifications) {
        await this.createNotification(notification);
      }

      console.log(`Notified ${adminUsers.length} admin(s) about verification documents submission: ${userName}`);
    } catch (error) {
      console.error('Failed to notify admins about verification documents submission:', error);
      // Don't throw error - document upload should not fail because of notification issues
    }
  }
}

// Background job functions (these would typically run via cron jobs or background tasks)
export class NotificationBackgroundJobs {
  /**
   * Checks for booking deadlines and sends reminders
   */
  static async checkDeadlineReminders(): Promise<void> {
    try {
      const reminderThreshold = new Date();
      reminderThreshold.setHours(reminderThreshold.getHours() + 24); // 24 hours from now

      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          *,
          guest:profiles!bookings_guest_id_profiles_fkey(first_name, last_name),
          host:profiles!bookings_host_id_profiles_fkey(first_name, last_name),
          race:races(name)
        `)
        .eq('status', 'pending')
        .lte('host_response_deadline', reminderThreshold.toISOString());

      if (bookings) {
        for (const booking of bookings) {
          // Check if reminder already sent
          const { data: existingReminder } = await supabase
            .from('user_notifications')
            .select('id')
            .eq('user_id', booking.host_id)
            .eq('type', NotificationService.TYPES.BOOKING_DEADLINE_REMINDER)
            .eq('data->booking_id', booking.id);

          if (!existingReminder || existingReminder.length === 0) {
            await NotificationService.notifyDeadlineReminder(booking);
          }
        }
      }
    } catch (error) {
      console.error('Error in deadline reminder job:', error);
    }
  }

  /**
   * Checks for bookings that should be confirmed (check-in date reached)
   */
  static async checkBookingConfirmations(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          *,
          guest:profiles!bookings_guest_id_profiles_fkey(first_name, last_name, phone),
          host:profiles!bookings_host_id_profiles_fkey(first_name, last_name, phone),
          race:races(name),
          property:properties(title)
        `)
        .eq('status', 'accepted')
        .eq('check_in_date', today);

      if (bookings) {
        for (const booking of bookings) {
          // Update status to confirmed
          await supabase
            .from('bookings')
            .update({ 
              status: 'confirmed',
              confirmed_at: new Date().toISOString()
            })
            .eq('id', booking.id);

          // Send confirmation notifications
          await NotificationService.notifyBookingConfirmed(booking);
        }
      }
    } catch (error) {
      console.error('Error in booking confirmation job:', error);
    }
  }

  /**
   * Checks for bookings that should be completed (check-out date reached)
   */
  static async checkBookingCompletions(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          *,
          guest:profiles!bookings_guest_id_profiles_fkey(first_name, last_name),
          host:profiles!bookings_host_id_profiles_fkey(first_name, last_name),
          race:races(name),
          property:properties(title)
        `)
        .eq('status', 'confirmed')
        .eq('check_out_date', today);

      if (bookings) {
        for (const booking of bookings) {
          // Update status to completed
          await supabase
            .from('bookings')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', booking.id);

          // Send completion notifications and review prompts
          await NotificationService.notifyBookingCompleted(booking);
        }
      }
    } catch (error) {
      console.error('Error in booking completion job:', error);
    }
  }
}
