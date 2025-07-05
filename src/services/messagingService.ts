import { supabase } from '@/integrations/supabase/client';
import { 
  Conversation, 
  Message, 
  MessageFormData, 
  ChatFilters,
  MessageError,
  RealtimeMessagePayload,
  RealtimeConversationPayload
} from '@/types/messaging';
import { PostgrestError, RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

/**
 * Comprehensive messaging service for real-time chat functionality
 * Handles all database operations, real-time subscriptions, and error management
 */
class MessagingService {
  private realtimeChannels: Map<string, RealtimeChannel> = new Map();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  // ========================================
  // CONVERSATION MANAGEMENT
  // ========================================

  /**
   * Get all conversations for a user with pagination and filtering
   */
  async getConversations(
    userId: string, 
    filters: ChatFilters = {},
    limit = 50,
    offset = 0
  ): Promise<{ data: Conversation[]; error?: MessageError }> {
    try {
      let query = supabase
        .from('conversations')
        .select(`
          *,
          booking:bookings!conversations_booking_id_fkey (
            id,
            status,
            check_in_date,
            check_out_date,
            race:races!bookings_race_id_fkey (
              name
            ),
            property:properties!bookings_property_id_fkey (
              title
            )
          ),
          participant_1:profiles!conversations_participant_1_id_fkey (
            id,
            first_name,
            last_name,
            profile_image_url,
            verification_status,
            average_rating
          ),
          participant_2:profiles!conversations_participant_2_id_fkey (
            id,
            first_name,
            last_name,
            profile_image_url,
            verification_status,
            average_rating
          )
        `)
        .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters.status === 'unread') {
        query = query.or(`unread_count_p1.gt.0,unread_count_p2.gt.0`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching conversations:', error);
        return { 
          data: [], 
          error: { 
            type: 'server', 
            message: 'Failed to load conversations',
            code: error.code 
          } 
        };
      }

      // Transform data to include other_participant
      const transformedData: Conversation[] = (data || []).map(conv => ({
        ...conv,
        booking: conv.booking ? {
          id: conv.booking.id,
          race_name: conv.booking.race?.name,
          property_title: conv.booking.property?.title,
          check_in_date: conv.booking.check_in_date,
          check_out_date: conv.booking.check_out_date,
          status: conv.booking.status,
        } : undefined,
        other_participant: conv.participant_1_id === userId 
          ? conv.participant_2 
          : conv.participant_1,
      }));

      return { data: transformedData };
    } catch (error) {
      console.error('Unexpected error fetching conversations:', error);
      return { 
        data: [], 
        error: { 
          type: 'network', 
          message: 'Network error while loading conversations' 
        } 
      };
    }
  }

  /**
   * Get conversation by booking ID
   */
  async getConversationByBooking(bookingId: string): Promise<{ data?: Conversation; error?: MessageError }> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          booking:bookings!conversations_booking_id_fkey (
            id,
            guest_id,
            host_id,
            status,
            check_in_date,
            check_out_date,
            race:races!bookings_race_id_fkey (
              name
            ),
            property:properties!bookings_property_id_fkey (
              title
            )
          )
        `)
        .eq('booking_id', bookingId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is OK
        return { 
          error: { 
            type: 'server', 
            message: 'Failed to load conversation',
            code: error.code 
          } 
        };
      }

      return { data: data || undefined };
    } catch (error) {
      return { 
        error: { 
          type: 'network', 
          message: 'Network error while loading conversation' 
        } 
      };
    }
  }

  // ========================================
  // MESSAGE MANAGEMENT
  // ========================================

  /**
   * Get messages for a specific booking/conversation
   */
  async getMessages(
    bookingId: string, 
    limit = 100, 
    before?: string
  ): Promise<{ data: Message[]; error?: MessageError }> {
    try {
      let query = supabase
        .from('booking_messages')
        .select(`
          *,
          sender:profiles!profiles_id_fkey(
            id,
            first_name,
            last_name,
            profile_image_url
          )
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching messages:', error);
        return { 
          data: [], 
          error: { 
            type: 'server', 
            message: 'Failed to load messages',
            code: error.code 
          } 
        };
      }

      // Reverse to show oldest first
      return { data: (data || []).reverse() };
    } catch (error) {
      console.error('Unexpected error fetching messages:', error);
      return { 
        data: [], 
        error: { 
          type: 'network', 
          message: 'Network error while loading messages' 
        } 
      };
    }
  }

  /**
   * Send a new message
   */
  async sendMessage(messageData: MessageFormData, senderId: string): Promise<{ data?: Message; error?: MessageError }> {
    try {
      // Validate message
      if (!messageData.message.trim()) {
        return { 
          error: { 
            type: 'validation', 
            message: 'Message cannot be empty' 
          } 
        };
      }

      if (messageData.message.length > 2000) {
        return { 
          error: { 
            type: 'validation', 
            message: 'Message is too long (max 2000 characters)' 
          } 
        };
      }

      const { data, error } = await supabase
        .from('booking_messages')
        .insert({
          booking_id: messageData.booking_id,
          sender_id: senderId,
          message: messageData.message.trim(),
          message_type: messageData.message_type || 'text',
        })
        .select(`
          *,
          sender:profiles!profiles_id_fkey(
            id,
            first_name,
            last_name,
            profile_image_url
          )
        `)
        .single();

      if (error) {
        console.error('Error sending message:', error);
        let errorMessage = 'Failed to send message';
        
        if (error.code === '23503') {
          errorMessage = 'You are not authorized to send messages in this conversation';
        } else if (error.code === '42501') {
          errorMessage = 'Permission denied. You may not be part of this booking.';
        }

        return { 
          error: { 
            type: 'permission', 
            message: errorMessage,
            code: error.code 
          } 
        };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error sending message:', error);
      return { 
        error: { 
          type: 'network', 
          message: 'Network error while sending message' 
        } 
      };
    }
  }

  /**
   * Mark messages as read for a user in a booking
   */
  async markMessagesAsRead(bookingId: string, userId: string): Promise<{ error?: MessageError }> {
    try {
      const { error } = await supabase.rpc('mark_messages_as_read', {
        p_booking_id: bookingId,
        p_user_id: userId,
      });

      if (error) {
        console.error('Error marking messages as read:', error);
        return { 
          error: { 
            type: 'server', 
            message: 'Failed to mark messages as read',
            code: error.code 
          } 
        };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error marking messages as read:', error);
      return { 
        error: { 
          type: 'network', 
          message: 'Network error while marking messages as read' 
        } 
      };
    }
  }

  /**
   * Get total unread message count for a user
   */
  async getUnreadCount(userId: string): Promise<{ data: number; error?: MessageError }> {
    try {
      const { data, error } = await supabase.rpc('get_user_unread_count', {
        p_user_id: userId,
      });

      if (error) {
        console.error('Error getting unread count:', error);
        return { 
          data: 0, 
          error: { 
            type: 'server', 
            message: 'Failed to get unread count',
            code: error.code 
          } 
        };
      }

      return { data: data || 0 };
    } catch (error) {
      console.error('Unexpected error getting unread count:', error);
      return { 
        data: 0, 
        error: { 
          type: 'network', 
          message: 'Network error while getting unread count' 
        } 
      };
    }
  }

  // ========================================
  // REAL-TIME SUBSCRIPTIONS
  // ========================================

  /**
   * Subscribe to real-time updates for conversations
   */
  subscribeToConversations(
    userId: string, 
    onUpdate: (payload: RealtimeConversationPayload) => void
  ): RealtimeChannel {
    const channelName = `conversations:${userId}`;
    
    // Remove existing channel if exists
    this.unsubscribeFromChannel(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `or(participant_1_id.eq.${userId},participant_2_id.eq.${userId})`,
        },
        (payload) => {
          onUpdate(payload as RealtimeConversationPayload);
        }
      )
      .subscribe();

    this.realtimeChannels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to real-time updates for messages in a specific booking
   */
  subscribeToMessages(
    bookingId: string, 
    onUpdate: (payload: RealtimeMessagePayload) => void
  ): RealtimeChannel {
    const channelName = `messages:${bookingId}`;
    
    // Remove existing channel if exists
    this.unsubscribeFromChannel(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          onUpdate(payload as RealtimeMessagePayload);
        }
      )
      .subscribe();

    this.realtimeChannels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to typing indicators (using presence)
   */
  subscribeToTyping(
    bookingId: string,
    userId: string,
    userName: string,
    onTypingUpdate: (users: any[]) => void
  ): RealtimeChannel {
    const channelName = `typing:${bookingId}`;
    
    // Remove existing channel if exists
    this.unsubscribeFromChannel(channelName);

    const channel = supabase
      .channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typingUsers = Object.values(state).flat().filter((user: any) => 
          user.user_id !== userId && user.typing
        );
        onTypingUpdate(typingUsers);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Handle user joining
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Handle user leaving
      })
      .subscribe();

    this.realtimeChannels.set(channelName, channel);
    return channel;
  }

  /**
   * Start typing indicator
   */
  startTyping(bookingId: string, userId: string, userName: string): void {
    const channelName = `typing:${bookingId}`;
    const channel = this.realtimeChannels.get(channelName);
    
    if (channel) {
      channel.track({
        user_id: userId,
        user_name: userName,
        typing: true,
        timestamp: new Date().toISOString(),
      });

      // Clear existing timeout
      const timeoutKey = `${bookingId}:${userId}`;
      const existingTimeout = this.typingTimeouts.get(timeoutKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout to stop typing after 3 seconds
      const timeout = setTimeout(() => {
        this.stopTyping(bookingId, userId, userName);
      }, 3000);

      this.typingTimeouts.set(timeoutKey, timeout);
    }
  }

  /**
   * Stop typing indicator
   */
  stopTyping(bookingId: string, userId: string, userName: string): void {
    const channelName = `typing:${bookingId}`;
    const channel = this.realtimeChannels.get(channelName);
    
    if (channel) {
      channel.track({
        user_id: userId,
        user_name: userName,
        typing: false,
        timestamp: new Date().toISOString(),
      });
    }

    // Clear timeout
    const timeoutKey = `${bookingId}:${userId}`;
    const existingTimeout = this.typingTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.typingTimeouts.delete(timeoutKey);
    }
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribeFromChannel(channelName: string): void {
    const channel = this.realtimeChannels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.realtimeChannels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels (cleanup)
   */
  unsubscribeAll(): void {
    this.realtimeChannels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
    });
    this.realtimeChannels.clear();

    // Clear all typing timeouts
    this.typingTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.typingTimeouts.clear();
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Format error for user display
   */
  formatError(error?: MessageError): string {
    if (!error) return 'An unknown error occurred';
    
    switch (error.type) {
      case 'network':
        return 'Connection error. Please check your internet and try again.';
      case 'permission':
        return error.message || 'You do not have permission to perform this action.';
      case 'validation':
        return error.message || 'Invalid input provided.';
      case 'server':
        return error.message || 'Server error. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }

  /**
   * Show error toast
   */
  showError(error?: MessageError): void {
    const message = this.formatError(error);
    toast.error(message);
  }

  /**
   * Validate booking access for user
   */
  async validateBookingAccess(bookingId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('id', bookingId)
        .or(`guest_id.eq.${userId},host_id.eq.${userId}`)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const messagingService = new MessagingService();
export default messagingService;
