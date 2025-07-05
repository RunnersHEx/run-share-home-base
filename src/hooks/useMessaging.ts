import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { messagingService } from '@/services/messagingService';
import {
  Conversation,
  Message,
  MessageFormData,
  ChatFilters,
  ChatState,
  MessageError,
  RealtimeMessagePayload,
  RealtimeConversationPayload,
} from '@/types/messaging';
import { toast } from 'sonner';

/**
 * Main hook for managing conversations
 * Provides conversation list, unread counts, and real-time updates
 */
export function useConversations(filters: ChatFilters = {}) {
  const { user } = useAuth();
  const [state, setState] = useState<{
    conversations: Conversation[];
    loading: boolean;
    error?: MessageError;
    unreadCount: number;
  }>({
    conversations: [],
    loading: true,
    error: undefined,
    unreadCount: 0,
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;

    setState(prev => ({ ...prev, loading: true, error: undefined }));

    try {
      const { data, error } = await messagingService.getConversations(user.id, filters);
      
      if (error) {
        setState(prev => ({ ...prev, error, loading: false }));
        return;
      }

      // Get unread count
      const { data: unreadCount, error: unreadError } = await messagingService.getUnreadCount(user.id);
      
      setState(prev => ({
        ...prev,
        conversations: data,
        unreadCount: unreadError ? 0 : unreadCount,
        loading: false,
        error: undefined,
      }));
    } catch (error) {
      console.error('Error in fetchConversations:', error);
      setState(prev => ({
        ...prev,
        error: { type: 'network', message: 'Failed to load conversations' },
        loading: false,
      }));
    }
  }, [user?.id, filters, refreshTrigger]);

  // Real-time subscription for conversations
  useEffect(() => {
    if (!user?.id) return;

    const channel = messagingService.subscribeToConversations(user.id, (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        // Refresh conversations when changes occur
        setRefreshTrigger(prev => prev + 1);
      }
    });

    return () => {
      messagingService.unsubscribeFromChannel(`conversations:${user.id}`);
    };
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const markAsRead = useCallback(async (conversationId: string) => {
    const conversation = state.conversations.find(c => c.id === conversationId);
    if (!conversation || !user?.id) return;

    const { error } = await messagingService.markMessagesAsRead(conversation.booking_id, user.id);
    if (error) {
      messagingService.showError(error);
    } else {
      refresh();
    }
  }, [state.conversations, user?.id, refresh]);

  return {
    conversations: state.conversations,
    loading: state.loading,
    error: state.error,
    unreadCount: state.unreadCount,
    refresh,
    markAsRead,
  };
}

/**
 * Hook for managing messages in a specific conversation/booking
 * Provides real-time message updates, sending, and read receipts
 */
export function useMessages(bookingId: string) {
  const { user } = useAuth();
  const [state, setState] = useState<{
    messages: Message[];
    loading: boolean;
    sending: boolean;
    error?: MessageError;
    hasMore: boolean;
  }>({
    messages: [],
    loading: true,
    sending: false,
    error: undefined,
    hasMore: true,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  // Fetch messages
  const fetchMessages = useCallback(async (before?: string) => {
    if (!bookingId) return;

    setState(prev => ({ ...prev, loading: true, error: undefined }));

    try {
      const { data, error } = await messagingService.getMessages(bookingId, 50, before);
      
      if (error) {
        setState(prev => ({ ...prev, error, loading: false }));
        return;
      }

      setState(prev => ({
        ...prev,
        messages: before ? [...data, ...prev.messages] : data,
        loading: false,
        hasMore: data.length === 50,
        error: undefined,
      }));

      // Mark messages as read if this is initial load and user is authenticated
      if (!before && user?.id) {
        await messagingService.markMessagesAsRead(bookingId, user.id);
      }
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      setState(prev => ({
        ...prev,
        error: { type: 'network', message: 'Failed to load messages' },
        loading: false,
      }));
    }
  }, [bookingId, user?.id]);

  // Send message
  const sendMessage = useCallback(async (messageData: MessageFormData) => {
    if (!user?.id || state.sending) return;

    setState(prev => ({ ...prev, sending: true, error: undefined }));

    try {
      const { data, error } = await messagingService.sendMessage(messageData, user.id);
      
      if (error) {
        setState(prev => ({ ...prev, error, sending: false }));
        messagingService.showError(error);
        return;
      }

      // Message will be added via real-time subscription
      setState(prev => ({ ...prev, sending: false }));
      setShouldScrollToBottom(true);
      
      toast.success('Message sent');
    } catch (error) {
      console.error('Error in sendMessage:', error);
      setState(prev => ({
        ...prev,
        error: { type: 'network', message: 'Failed to send message' },
        sending: false,
      }));
      messagingService.showError({ type: 'network', message: 'Failed to send message' });
    }
  }, [user?.id, state.sending]);

  // Load more messages (pagination)
  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.loading) return;

    const oldestMessage = state.messages[0];
    if (oldestMessage) {
      await fetchMessages(oldestMessage.created_at);
    }
  }, [state.hasMore, state.loading, state.messages, fetchMessages]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!bookingId) return;

    const channel = messagingService.subscribeToMessages(bookingId, (payload) => {
      if (payload.eventType === 'INSERT') {
        setState(prev => {
          // Avoid duplicates
          const exists = prev.messages.some(msg => msg.id === payload.new.id);
          if (!exists) {
            setShouldScrollToBottom(true);
            return {
              ...prev,
              messages: [...prev.messages, payload.new],
            };
          }
          return prev;
        });
      } else if (payload.eventType === 'UPDATE') {
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === payload.new.id ? payload.new : msg
          ),
        }));
      }
    });

    return () => {
      messagingService.unsubscribeFromChannel(`messages:${bookingId}`);
    };
  }, [bookingId]);

  // Initial fetch
  useEffect(() => {
    if (bookingId) {
      fetchMessages();
    }
  }, [fetchMessages, bookingId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldScrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShouldScrollToBottom(false);
    }
  }, [state.messages.length, shouldScrollToBottom]);

  return {
    messages: state.messages,
    loading: state.loading,
    sending: state.sending,
    error: state.error,
    hasMore: state.hasMore,
    sendMessage,
    loadMore,
    refresh: fetchMessages,
    messagesEndRef,
  };
}

/**
 * Hook for managing typing indicators
 */
export function useTypingIndicator(bookingId: string) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Subscribe to typing indicators
  useEffect(() => {
    if (!bookingId || !user?.id) return;

    const userName = `${user.first_name} ${user.last_name}`.trim() || 'User';
    
    const channel = messagingService.subscribeToTyping(
      bookingId,
      user.id,
      userName,
      setTypingUsers
    );

    return () => {
      messagingService.unsubscribeFromChannel(`typing:${bookingId}`);
    };
  }, [bookingId, user?.id, user?.first_name, user?.last_name]);

  const startTyping = useCallback(() => {
    if (!bookingId || !user?.id) return;

    const userName = `${user.first_name} ${user.last_name}`.trim() || 'User';
    messagingService.startTyping(bookingId, user.id, userName);
  }, [bookingId, user?.id, user?.first_name, user?.last_name]);

  const stopTyping = useCallback(() => {
    if (!bookingId || !user?.id) return;

    const userName = `${user.first_name} ${user.last_name}`.trim() || 'User';
    messagingService.stopTyping(bookingId, user.id, userName);
  }, [bookingId, user?.id, user?.first_name, user?.last_name]);

  const handleTyping = useCallback(() => {
    startTyping();

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1000);
  }, [startTyping, stopTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    };
  }, [stopTyping]);

  return {
    typingUsers,
    handleTyping,
    startTyping,
    stopTyping,
  };
}

/**
 * Hook for comprehensive chat state management
 * Combines conversations and active conversation management
 */
export function useChat() {
  const { user } = useAuth();
  const [activeConversation, setActiveConversation] = useState<Conversation | undefined>();
  const [chatFilters, setChatFilters] = useState<ChatFilters>({});
  
  const conversationsData = useConversations(chatFilters);
  const messagesData = useMessages(activeConversation?.booking_id || '');

  const openConversation = useCallback((conversation: Conversation) => {
    setActiveConversation(conversation);
  }, []);

  const closeConversation = useCallback(() => {
    setActiveConversation(undefined);
  }, []);

  const openConversationByBooking = useCallback(async (bookingId: string) => {
    if (!user?.id) return;

    // First check if conversation already exists in our list
    const existing = conversationsData.conversations.find(c => c.booking_id === bookingId);
    if (existing) {
      setActiveConversation(existing);
      return;
    }

    // If not in list, fetch it directly
    const { data, error } = await messagingService.getConversationByBooking(bookingId);
    if (error) {
      messagingService.showError(error);
      return;
    }

    if (data) {
      setActiveConversation(data);
    } else {
      // No conversation exists yet - it will be created when first message is sent
      // For now, we'll create a minimal conversation object for UI purposes
      const { data: booking } = await messagingService.getConversationByBooking(bookingId);
      // This is a placeholder - the real conversation will be created when messaging starts
      toast.info('Start a conversation by sending the first message');
    }
  }, [user?.id, conversationsData.conversations]);

  // Auto-refresh conversations when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      conversationsData.refresh();
    }
  }, [activeConversation?.id]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      messagingService.unsubscribeAll();
    };
  }, []);

  return {
    // Conversations
    conversations: conversationsData.conversations,
    conversationsLoading: conversationsData.loading,
    conversationsError: conversationsData.error,
    unreadCount: conversationsData.unreadCount,
    refreshConversations: conversationsData.refresh,
    markConversationAsRead: conversationsData.markAsRead,

    // Active conversation
    activeConversation,
    openConversation,
    closeConversation,
    openConversationByBooking,

    // Messages
    messages: messagesData.messages,
    messagesLoading: messagesData.loading,
    messagesSending: messagesData.sending,
    messagesError: messagesData.error,
    hasMoreMessages: messagesData.hasMore,
    sendMessage: messagesData.sendMessage,
    loadMoreMessages: messagesData.loadMore,
    messagesEndRef: messagesData.messagesEndRef,

    // Filters
    chatFilters,
    setChatFilters,

    // Utility
    user,
  };
}

/**
 * Hook for global unread message count (for navbar badge)
 */
export function useUnreadCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await messagingService.getUnreadCount(user.id);
      setUnreadCount(error ? 0 : data);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Subscribe to conversation updates to refresh count
  useEffect(() => {
    if (!user?.id) return;

    const channel = messagingService.subscribeToConversations(user.id, () => {
      fetchUnreadCount();
    });

    return () => {
      messagingService.unsubscribeFromChannel(`conversations:${user.id}`);
    };
  }, [user?.id, fetchUnreadCount]);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    refresh: fetchUnreadCount,
  };
}

/**
 * Hook for validating messaging access
 */
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
        const access = await messagingService.validateBookingAccess(bookingId, user.id);
        setHasAccess(access);
      } catch (error) {
        console.error('Error checking messaging access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [bookingId, user?.id]);

  return {
    hasAccess,
    loading,
  };
}
