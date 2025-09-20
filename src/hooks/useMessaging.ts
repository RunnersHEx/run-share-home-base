import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ==========================================
// SIMPLIFIED TYPES
// ==========================================

export interface Message {
  id: string;
  booking_id: string;
  conversation_id?: string;
  sender_id: string;
  message: string;
  message_type: 'text' | 'system';
  read_at?: string;
  created_at: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image_url?: string;
  };
}

export interface Conversation {
  id: string;
  booking_id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string;
  last_message?: string;
  unread_count_p1: number;
  unread_count_p2: number;
  other_participant?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image_url?: string;
    verification_status?: string;
    average_rating?: number;
  };
  booking?: {
    id: string;
    race_name?: string;
    property_title?: string;
    status: string;
  };
}

export interface MessageError {
  type: 'network' | 'permission' | 'validation' | 'server';
  message: string;
  code?: string;
}

// ==========================================
// CORE MESSAGING SERVICE (Simplified)
// ==========================================

class SimplifiedMessagingService {
  private channels = new Map<string, RealtimeChannel>();
  private messageCache = new Map<string, Message[]>();
  private maxCacheSize = 50; // Limit cache size
  private retryAttempts = new Map<string, number>();
  private maxRetries = 2; // Reduced retry attempts
  private activeConversations = new Set<string>(); // Track active/open conversations

  // Clean up all subscriptions
  cleanup() {
    this.channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.messageCache.clear();
    this.retryAttempts.clear();
    this.activeConversations.clear();
  }

  // Track active/open conversations to prevent unread count increment
  setConversationActive(bookingId: string, isActive: boolean) {
    if (isActive) {
      this.activeConversations.add(bookingId);
    } else {
      this.activeConversations.delete(bookingId);
    }
  }

  isConversationActive(bookingId: string): boolean {
    return this.activeConversations.has(bookingId);
  }

  // Subscribe to messages for a booking with simplified error handling
  subscribeToMessages(
    bookingId: string, 
    onUpdate: (message: Message) => void,  // Changed: now passes single new message
    onError: (error: MessageError) => void,
    isActive: boolean = false  // New: to know if chat is currently active/open
  ): () => void {
    const channelKey = `messages-${bookingId}`;
    
    // Clean up existing subscription
    const existingChannel = this.channels.get(channelKey);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        async (payload) => {
          try {
            const newMessage = payload.new as Message;
            
            // Get sender info
            const { data: sender } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, profile_image_url')
              .eq('id', newMessage.sender_id)
              .single();

            const enrichedMessage = { ...newMessage, sender: sender || undefined };
            
            // Pass only the new message to the hook for deduplication
            onUpdate(enrichedMessage);
            
            // If this conversation is active and the message is from someone else,
            // correct the unread count since the user is seeing the message
            if (isActive && newMessage.sender_id !== enrichedMessage.sender?.id) {
              // We'll need the current user ID for this - pass it through the subscription
              // For now, we'll handle this in the hook level
            }
          } catch (error) {
            console.error('Real-time message processing error:', error);
            onError({
              type: 'network',
              message: 'Failed to process real-time message'
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          const attempts = this.retryAttempts.get(channelKey) || 0;
          if (attempts < this.maxRetries) {
            this.retryAttempts.set(channelKey, attempts + 1);
            setTimeout(() => {
              this.subscribeToMessages(bookingId, onUpdate, onError);
            }, 1000 * Math.pow(2, attempts));
          } else {
            onError({
              type: 'network',
              message: 'Real-time connection failed'
            });
          }
        } else if (status === 'SUBSCRIBED') {
          this.retryAttempts.delete(channelKey);
        }
      });

    this.channels.set(channelKey, channel);

    // Return cleanup function
    return () => {
      const ch = this.channels.get(channelKey);
      if (ch) {
        supabase.removeChannel(ch);
        this.channels.delete(channelKey);
      }
    };
  }

  // Subscribe to conversations for real-time list updates
  subscribeToConversations(
    userId: string,
    onUpdate: () => void,
    onError: (error: MessageError) => void
  ): () => void {
    const channelKey = `conversations-${userId}`;
    
    // Clean up existing subscription
    const existingChannel = this.channels.get(channelKey);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participant_1_id=eq.${userId},participant_2_id=eq.${userId}`,
        },
        async (payload) => {
          try {
            // Trigger refresh of conversations
            onUpdate();
          } catch (error) {
            console.error('Real-time conversation processing error:', error);
            onError({
              type: 'network',
              message: 'Failed to process real-time conversation update'
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          const attempts = this.retryAttempts.get(channelKey) || 0;
          if (attempts < this.maxRetries) {
            this.retryAttempts.set(channelKey, attempts + 1);
            setTimeout(() => {
              this.subscribeToConversations(userId, onUpdate, onError);
            }, 1000 * Math.pow(2, attempts));
          } else {
            onError({
              type: 'network',
              message: 'Real-time conversation connection failed'
            });
          }
        } else if (status === 'SUBSCRIBED') {
          this.retryAttempts.delete(channelKey);
        }
      });

    this.channels.set(channelKey, channel);

    // Return cleanup function
    return () => {
      const ch = this.channels.get(channelKey);
      if (ch) {
        supabase.removeChannel(ch);
        this.channels.delete(channelKey);
      }
    };
  }

  // Fetch messages with pagination
  async fetchMessages(
    bookingId: string,
    page = 0,
    limit = 50
  ): Promise<{ data: Message[]; hasMore: boolean; error?: MessageError }> {
    try {
      // Check cache first for page 0
      if (page === 0) {
        const cached = this.messageCache.get(bookingId);
        if (cached && cached.length > 0) {
          return { data: cached, hasMore: cached.length >= limit };
        }
      }

      const offset = page * limit;
      const { data: messages, error } = await supabase
        .from('booking_messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return {
          data: [],
          hasMore: false,
          error: {
            type: 'server',
            message: 'Failed to fetch messages',
            code: error.code
          }
        };
      }

      if (!messages || messages.length === 0) {
        return { data: [], hasMore: false };
      }

      // Fetch sender details
      const senderIds = [...new Set(messages.map(msg => msg.sender_id))];
      const { data: senders } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, profile_image_url')
        .in('id', senderIds);

      const sendersMap = new Map();
      senders?.forEach(sender => sendersMap.set(sender.id, sender));

      const enrichedMessages = messages
        .map(msg => ({
          ...msg,
          sender: sendersMap.get(msg.sender_id)
        }))
        .reverse(); // Reverse to show oldest first

      // Cache only first page
      if (page === 0) {
        this.messageCache.set(bookingId, enrichedMessages);
        // Limit cache size
        if (this.messageCache.size > this.maxCacheSize) {
          const oldestKey = this.messageCache.keys().next().value;
          this.messageCache.delete(oldestKey);
        }
      }

      return {
        data: enrichedMessages,
        hasMore: messages.length >= limit
      };
    } catch (error: any) {
      return {
        data: [],
        hasMore: false,
        error: {
          type: 'network',
          message: 'Network error while fetching messages'
        }
      };
    }
  }

  // Send message with optimistic updates and conversation handling
  async sendMessage(
    bookingId: string,
    message: string,
    senderId: string
  ): Promise<{ data?: Message; error?: MessageError }> {
    // Validation
    if (!message.trim()) {
      return {
        error: {
          type: 'validation',
          message: 'Message cannot be empty'
        }
      };
    }

    if (message.length > 2000) {
      return {
        error: {
          type: 'validation',
          message: 'Message too long (max 2000 characters)'
        }
      };
    }

    // Check if messaging is blocked for this booking
    try {
      const { data: isBlocked, error: blockCheckError } = await supabase.rpc('is_messaging_blocked', {
        p_booking_id: bookingId
      });
      
      if (blockCheckError) {
        console.error('Error checking messaging blocked status:', blockCheckError);
      } else if (isBlocked) {
        return {
          error: {
            type: 'permission',
            message: 'Esta conversación ha sido bloqueada por motivos de seguridad. Ya no es posible enviar mensajes.'
          }
        };
      }
    } catch (error) {
      console.error('Error in messaging blocked check:', error);
    }

    try {
      // First, ensure conversation exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('booking_id', bookingId)
        .single();

      let conversationId = existingConversation?.id;

      // If conversation doesn't exist, create it
      if (!conversationId) {
        // Get booking details to create conversation
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select('guest_id, host_id')
          .eq('id', bookingId)
          .single();

        if (bookingError || !booking) {
          return {
            error: {
              type: 'server',
              message: 'Booking not found or access denied'
            }
          };
        }

        // Create conversation
        const { data: newConversation, error: conversationError } = await supabase
          .from('conversations')
          .insert({
            booking_id: bookingId,
            participant_1_id: booking.guest_id,
            participant_2_id: booking.host_id
          })
          .select('id')
          .single();

        if (conversationError || !newConversation) {
          return {
            error: {
              type: 'server',
              message: 'Failed to create conversation'
            }
          };
        }

        conversationId = newConversation.id;
      }

      // Insert message with conversation_id
      const { data, error } = await supabase
        .from('booking_messages')
        .insert({
          booking_id: bookingId,
          conversation_id: conversationId,
          sender_id: senderId,
          message: message.trim(),
          message_type: 'text'
        })
        .select('*')
        .single();

      if (error) {
        let errorMessage = 'Failed to send message';
        let errorType: MessageError['type'] = 'server';

        if (error.code === '23503') {
          errorMessage = 'You are not authorized to send messages in this conversation';
          errorType = 'permission';
        } else if (error.code === '42501') {
          errorMessage = 'Permission denied. You may not be part of this booking.';
          errorType = 'permission';
        }

        return {
          error: {
            type: errorType,
            message: errorMessage,
            code: error.code
          }
        };
      }

      // Get sender info
      const { data: sender } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, profile_image_url')
        .eq('id', senderId)
        .single();

      const enrichedMessage = {
        ...data,
        sender: sender || undefined
      };

      // Update cache
      const cached = this.messageCache.get(bookingId) || [];
      const updated = [...cached, enrichedMessage];
      this.messageCache.set(bookingId, updated);

      // Note: Unread count should be updated by database triggers or real-time subscriptions
      // Removed manual updateConversationUnreadCount call to prevent double counting

      // Dispatch event for unread count refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('message-sent', { detail: { bookingId, senderId } }));
      }

      return { data: enrichedMessage };
    } catch (error: any) {
      return {
        error: {
          type: 'network',
          message: 'Network error while sending message'
        }
      };
    }
  }

  // Mark messages as read (using direct SQL since function doesn't exist)
  async markAsRead(bookingId: string, userId: string): Promise<void> {
    try {
      // Update messages directly instead of using missing function
      await supabase
        .from('booking_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('booking_id', bookingId)
        .neq('sender_id', userId)
        .is('read_at', null);
      
      // Invalidate unread count cache to force refresh
      this.unreadCountCache = null;
    } catch (error) {
      // Silent failure for read receipts - not critical for UX
      console.warn('Failed to mark messages as read:', error);
    }
  }

  // Mark conversation as read immediately (for when conversation is opened)
  async markConversationAsRead(bookingId: string, userId: string): Promise<void> {
    try {
      // Update local cache first for immediate UI update
      this.unreadCountCache = null;
      
      // Dispatch event for immediate UI refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('conversation-read', { detail: { bookingId, userId } }));
      }
      
      // Mark messages as read in the database
      await this.markAsRead(bookingId, userId);
      
      // Reset unread count for this user in the conversation
      const { data: conversation } = await supabase
        .from('conversations')
        .select('participant_1_id, participant_2_id')
        .eq('booking_id', bookingId)
        .single();

      if (conversation) {
        const updateField = conversation.participant_1_id === userId 
          ? 'unread_count_p1' 
          : 'unread_count_p2';
        
        await supabase
          .from('conversations')
          .update({ [updateField]: 0 })
          .eq('booking_id', bookingId);
      }
      
      return Promise.resolve();
    } catch (error) {
      console.warn('Failed to mark conversation as read:', error);
      return Promise.resolve(); // Don't throw - this is best effort
    }
  }

  // Correct unread count for active conversations (called after message is received)
  async correctUnreadCountForActiveConversation(bookingId: string, userId: string): Promise<void> {
    if (!this.isConversationActive(bookingId)) {
      return; // Only correct count if conversation is active
    }

    try {
      // Get conversation to determine which field to update
      const { data: conversation } = await supabase
        .from('conversations')
        .select('participant_1_id, participant_2_id, unread_count_p1, unread_count_p2')
        .eq('booking_id', bookingId)
        .single();

      if (!conversation) return;

      // Determine which participant's unread count to decrement
      const isParticipant1 = conversation.participant_1_id === userId;
      const updateField = isParticipant1 ? 'unread_count_p1' : 'unread_count_p2';
      const currentCount = isParticipant1 
        ? conversation.unread_count_p1 
        : conversation.unread_count_p2;

      // If there's an unread count, decrement it since the conversation is active
      if (currentCount > 0) {
        await supabase
          .from('conversations')
          .update({ [updateField]: Math.max(0, currentCount - 1) })
          .eq('booking_id', bookingId);

        // Invalidate cache
        this.unreadCountCache = null;
      }
    } catch (error) {
      console.warn('Failed to correct unread count for active conversation:', error);
    }
  }

  // Get unread count with caching
  private unreadCountCache: { count: number; timestamp: number; userId: string } | null = null;
  private unreadCountCacheTimeout = 10000; // 10 seconds

  async getUnreadCount(userId: string): Promise<number> {
    try {
      // Check cache
      if (this.unreadCountCache &&
          this.unreadCountCache.userId === userId &&
          Date.now() - this.unreadCountCache.timestamp < this.unreadCountCacheTimeout) {
        return this.unreadCountCache.count;
      }

      // Calculate unread count directly since function doesn't exist
      const { data: conversations } = await supabase
        .from('conversations')
        .select('participant_1_id, participant_2_id, unread_count_p1, unread_count_p2')
        .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`);

      if (!conversations) {
        return 0;
      }

      const count = conversations.reduce((total, conv) => {
        // Get the unread count for this user
        const userUnreadCount = conv.participant_1_id === userId 
          ? conv.unread_count_p1 
          : conv.unread_count_p2;
        return total + (userUnreadCount || 0);
      }, 0);
      
      // Update cache
      this.unreadCountCache = {
        count,
        timestamp: Date.now(),
        userId
      };

      return count;
    } catch (error) {
      console.warn('Error getting unread count:', error);
      return 0;
    }
  }

  // Invalidate caches
  invalidateCache(bookingId?: string) {
    if (bookingId) {
      this.messageCache.delete(bookingId);
    } else {
      this.messageCache.clear();
    }
    this.unreadCountCache = null;
  }
}

// Singleton instance
const messagingService = new SimplifiedMessagingService();

// ==========================================
// SIMPLIFIED MESSAGING HOOK
// ==========================================

export function useMessaging(bookingId?: string) {
  const { user } = useAuth();
  const [state, setState] = useState({
    messages: [] as Message[],
    conversations: [] as Conversation[],
    unreadCount: 0,
    loading: false,
    sending: false,
    error: null as MessageError | null,
    hasMoreMessages: false,
    currentPage: 0
  });

  const cleanupRef = useRef<(() => void) | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  // Load messages for specific booking
  const loadMessages = useCallback(async (page = 0, append = false) => {
    if (!bookingId || !user?.id || !mountedRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    const result = await messagingService.fetchMessages(bookingId, page);

    if (!mountedRef.current) return;

    if (result.error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: result.error!
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      messages: append ? [...prev.messages, ...result.data] : result.data,
      hasMoreMessages: result.hasMore,
      currentPage: page,
      loading: false,
      error: null
    }));

    // Mark messages as read
    if (result.data.length > 0) {
      messagingService.markAsRead(bookingId, user.id);
    }
  }, [bookingId, user?.id]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user?.id || !mountedRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Simplified conversation query
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          booking:bookings!inner(
            id,
            race:races(name),
            property:properties(title),
            status
          )
        `)
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (!mountedRef.current) return;

      if (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: {
            type: 'server',
            message: 'Failed to load conversations',
            code: error.code
          }
        }));
        return;
      }

      // Get other participants
      const otherParticipantIds = conversations?.map(conv =>
        conv.participant_1_id === user.id ? conv.participant_2_id : conv.participant_1_id
      ) || [];

      const { data: participants } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, profile_image_url, verification_status, average_rating')
        .in('id', otherParticipantIds);

      const participantsMap = new Map();
      participants?.forEach(p => participantsMap.set(p.id, p));

      const enrichedConversations = conversations?.map(conv => ({
        ...conv,
        other_participant: participantsMap.get(
          conv.participant_1_id === user.id ? conv.participant_2_id : conv.participant_1_id
        ),
        booking: conv.booking ? {
          ...conv.booking,
          race_name: conv.booking.race?.name,
          property_title: conv.booking.property?.title
        } : undefined
      })) || [];

      setState(prev => ({
        ...prev,
        conversations: enrichedConversations,
        loading: false,
        error: null
      }));

    } catch (error: any) {
      if (!mountedRef.current) return;
      setState(prev => ({
        ...prev,
        loading: false,
        error: {
          type: 'network',
          message: 'Network error loading conversations'
        }
      }));
    }
  }, [user?.id]);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    const count = await messagingService.getUnreadCount(user.id);
    
    if (mountedRef.current) {
      setState(prev => ({ ...prev, unreadCount: count }));
    }
  }, [user?.id]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(() => {
    if (state.hasMoreMessages && !state.loading) {
      loadMessages(state.currentPage + 1, true);
    }
  }, [state.hasMoreMessages, state.loading, state.currentPage, loadMessages]);

  // Send message
  const sendMessage = useCallback(async (message: string) => {
    if (!bookingId || !user?.id || !message.trim() || state.sending) return;

    setState(prev => ({ ...prev, sending: true, error: null }));

    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      booking_id: bookingId,
      sender_id: user.id,
      message: message.trim(),
      message_type: 'text',
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        first_name: user.first_name || 'You',
        last_name: user.last_name || '',
        profile_image_url: user.profile_image_url
      }
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, optimisticMessage]
    }));

    // Send to server
    const result = await messagingService.sendMessage(bookingId, message, user.id);

    if (!mountedRef.current) return;

    if (result.error) {
      // Remove optimistic message on error
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => msg.id !== optimisticMessage.id),
        sending: false,
        error: result.error!
      }));
      toast.error(result.error.message);
      return;
    }

    // Replace optimistic message with real message only if it exists
    setState(prev => {
      const hasOptimisticMessage = prev.messages.some(msg => msg.id === optimisticMessage.id);
      if (hasOptimisticMessage) {
        return {
          ...prev,
          messages: prev.messages.map(msg =>
            msg.id === optimisticMessage.id ? result.data! : msg
          ),
          sending: false,
          error: null
        };
      } else {
        // Optimistic message was already removed or replaced, just update state
        return {
          ...prev,
          sending: false,
          error: null
        };
      }
    });

    // Scroll to bottom
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);

  }, [bookingId, user, state.sending]);

  // Refresh functions
  const refresh = useCallback(() => {
    messagingService.invalidateCache(bookingId);
    if (bookingId) {
      loadMessages();
    } else {
      loadConversations();
    }
    loadUnreadCount();
  }, [bookingId, loadMessages, loadConversations, loadUnreadCount]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (conversationBookingId: string) => {
    if (!user?.id) return;
    
    await messagingService.markConversationAsRead(conversationBookingId, user.id);
    
    // Refresh unread count after marking as read
    setTimeout(() => {
      if (mountedRef.current) {
        loadUnreadCount();
      }
    }, 100);
  }, [user?.id, loadUnreadCount]);

  // Set up real-time subscriptions for specific booking
  useEffect(() => {
    if (!bookingId || !user?.id || !mountedRef.current) return;

    // Mark this conversation as active
    messagingService.setConversationActive(bookingId, true);

    // Cleanup any existing subscription first
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    const cleanup = messagingService.subscribeToMessages(
      bookingId,
      (newMessage) => {
        if (mountedRef.current) {
          setState(prev => {
            // Check if this exact message already exists by ID
            const exactMessageExists = prev.messages.some(msg => msg.id === newMessage.id);
            if (exactMessageExists) {
              return prev; // Do nothing if exact message already exists
            }
            
            // Look for temporary message to replace
            const tempMessageIndex = prev.messages.findIndex(msg => 
              msg.id.startsWith('temp-') && 
              msg.message === newMessage.message && 
              msg.sender_id === newMessage.sender_id &&
              Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000
            );
            
            if (tempMessageIndex !== -1) {
              // Replace the temporary message with the real message
              const updatedMessages = [...prev.messages];
              updatedMessages[tempMessageIndex] = newMessage;
              return {
                ...prev,
                messages: updatedMessages
              };
            } else {
              // Add new message (from other users or if no temp message found)
              return {
                ...prev,
                messages: [...prev.messages, newMessage]
              };
            }
          });
          
          // If this message is from someone else and conversation is active,
          // correct the unread count since user is seeing the message
          if (newMessage.sender_id !== user.id) {
            setTimeout(() => {
              messagingService.correctUnreadCountForActiveConversation(bookingId, user.id);
            }, 1000); // Small delay to let database triggers finish
          }
        }
      },
      (error) => {
        if (mountedRef.current) {
          setState(prev => ({ ...prev, error }));
        }
      },
      true // isActive = true since this is an active chat
    );

    cleanupRef.current = () => {
      cleanup();
      // Mark conversation as inactive when cleanup
      messagingService.setConversationActive(bookingId, false);
    };

    return cleanupRef.current;
  }, [bookingId, user?.id]);

  // Set up real-time subscriptions for conversation list (when no specific booking)
  useEffect(() => {
    if (bookingId || !user?.id || !mountedRef.current) return; // Only for conversation list mode

    const cleanup = messagingService.subscribeToConversations(
      user.id,
      () => {
        // Refresh conversations when changes detected
        if (mountedRef.current) {
          loadConversations();
        }
      },
      (error) => {
        if (mountedRef.current) {
          setState(prev => ({ ...prev, error }));
        }
      }
    );

    return cleanup;
  }, [bookingId, user?.id, loadConversations]);

  // Initial data loading
  useEffect(() => {
    if (bookingId) {
      loadMessages();
    } else {
      loadConversations();
    }
    loadUnreadCount();
  }, [bookingId, loadMessages, loadConversations, loadUnreadCount]);

  return {
    // Data
    messages: state.messages,
    conversations: state.conversations,
    unreadCount: state.unreadCount,
    
    // State
    loading: state.loading,
    sending: state.sending,
    error: state.error,
    hasMoreMessages: state.hasMoreMessages,
    
    // Actions
    sendMessage,
    loadMoreMessages,
    refresh,
    clearError,
    markConversationAsRead,
    
    // Refs
    messagesEndRef
  };
}

// Export service for cleanup
export { messagingService };

// ==========================================
// UTILITY HOOKS
// ==========================================

// Simple unread count hook with auto-refresh
export function useUnreadCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const count = await messagingService.getUnreadCount(user.id);
    if (mountedRef.current) {
      setUnreadCount(count);
      setLoading(false);
    }
  }, [user?.id]);

  // Setup auto-refresh every 5 seconds
  useEffect(() => {
    mountedRef.current = true;
    
    // Initial load
    refresh();
    
    // Setup interval for auto-refresh
    refreshIntervalRef.current = setInterval(refresh, 5000);
    
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refresh]);

  // Listen for custom events to refresh immediately
  useEffect(() => {
    const handleConversationRead = () => {
      if (mountedRef.current) {
        refresh();
      }
    };

    // Listen for conversation read events
    window.addEventListener('conversation-read', handleConversationRead);
    window.addEventListener('message-sent', handleConversationRead);
    
    return () => {
      window.removeEventListener('conversation-read', handleConversationRead);
      window.removeEventListener('message-sent', handleConversationRead);
    };
  }, [refresh]);

  return { unreadCount, loading, refresh };
}

// Access validation hook
export function useMessagingAccess(bookingId?: string) {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!bookingId || !user?.id) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('id')
          .eq('id', bookingId)
          .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`)
          .single();

        setHasAccess(!error && !!data);
      } catch {
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [bookingId, user?.id]);

  return { hasAccess, loading };
}
