// Main messaging components
export { default as MessagingPage } from './MessagingPage';
export { default as ChatInterface } from './ChatInterface';
export { default as ConversationList } from './ConversationList';
export { default as MessagingModal } from './MessagingModal';
export { default as UnreadBadge } from './UnreadBadge';

// Re-export hooks for convenience
export { 
  useMessaging,
  useUnreadCount,
  useMessagingAccess,
  messagingService
} from '@/hooks/useMessaging';

// Re-export types
export type {
  Conversation,
  Message,
  MessageFormData,
  ChatState,
  ChatFilters,
  MessageNotification,
  ChatInterfaceProps,
  MessageListProps,
  MessageInputProps,
  ConversationListProps,
  ChatHeaderProps,
  UnreadBadgeProps,
} from '@/types/messaging';
