export interface Conversation {
  id: string;
  booking_id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string;
  last_message?: string;
  unread_count_p1: number;
  unread_count_p2: number;
  created_at: string;
  updated_at: string;
  
  // Expanded data from joins
  booking?: {
    id: string;
    race_name?: string;
    property_title?: string;
    check_in_date: string;
    check_out_date: string;
    status: string;
  };
  
  other_participant?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image_url?: string;
    verification_status: string;
    average_rating?: number;
  };
}

export interface Message {
  id: string;
  conversation_id?: string; // Optional for backwards compatibility with existing messages
  booking_id: string;
  sender_id: string; // References auth.users(id) - matches existing schema
  message: string;
  message_type: 'text' | 'system' | 'booking_update';
  read_at?: string;
  edited_at?: string;
  created_at: string;
  
  // Expanded sender info from profiles table via JOIN
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image_url?: string;
  };
}

export interface MessageFormData {
  booking_id: string;
  message: string;
  message_type?: 'text' | 'system' | 'booking_update';
}

export interface ChatState {
  conversations: Conversation[];
  activeConversation?: Conversation;
  messages: Record<string, Message[]>; // booking_id -> messages
  loading: boolean;
  sending: boolean;
  error?: string;
  unreadCount: number;
}

export interface ChatFilters {
  status?: 'all' | 'unread' | 'recent';
  search?: string;
}

export interface MessageNotification {
  conversation_id: string;
  booking_id: string;
  sender_name: string;
  message_preview: string;
  unread_count: number;
}

export interface TypingIndicator {
  booking_id: string;
  user_id: string;
  user_name: string;
  timestamp: string;
}

// Real-time subscription types
export interface RealtimeMessagePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Message;
  old?: Message;
}

export interface RealtimeConversationPayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Conversation;
  old?: Conversation;
}

// Component props
export interface ChatInterfaceProps {
  bookingId: string;
  currentUserId: string;
  onClose?: () => void;
  className?: string;
}

export interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  loading?: boolean;
  onMessageRead?: (messageId: string) => void;
}

export interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  currentUserId: string;
  onConversationSelect: (conversation: Conversation) => void;
  onMarkAsRead?: (conversationId: string) => void;
  loading?: boolean;
}

export interface ChatHeaderProps {
  conversation: Conversation;
  otherParticipant: Conversation['other_participant'];
  onClose?: () => void;
  onViewBooking?: (bookingId: string) => void;
}

export interface UnreadBadgeProps {
  count: number;
  className?: string;
}

// Validation schemas
export const MessageValidation = {
  maxLength: 2000,
  minLength: 1,
  allowedTypes: ['text', 'system', 'booking_update'] as const,
};

// Error types
export interface MessageError {
  type: 'network' | 'permission' | 'validation' | 'server';
  message: string;
  code?: string;
}

// Chat settings
export interface ChatSettings {
  enableRealtime: boolean;
  enableTypingIndicators: boolean;
  enableReadReceipts: boolean;
  messageRetentionDays: number;
  maxMessagesPerConversation: number;
  allowMessageEditing: boolean;
  enableNotifications: boolean;
}

// Default settings
export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  enableRealtime: true,
  enableTypingIndicators: true,
  enableReadReceipts: true,
  messageRetentionDays: 365,
  maxMessagesPerConversation: 1000,
  allowMessageEditing: true,
  enableNotifications: true,
};

// Status enums
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type ConversationStatus = 'active' | 'archived' | 'blocked';

// Analytics events
export interface ChatAnalyticsEvent {
  event: 'message_sent' | 'conversation_opened' | 'message_read' | 'typing_start' | 'typing_stop';
  booking_id: string;
  conversation_id?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
