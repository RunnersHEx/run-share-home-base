// ==========================================
// MESSAGING SERVICE - SIMPLIFIED VERSION
// ==========================================
// This is a simplified wrapper around the new messaging system
// The actual service logic is now integrated into useMessaging hook

import { messagingService } from '@/hooks/useMessaging';

// Export the service for backward compatibility
export { messagingService };
export default messagingService;

// Legacy compatibility exports
export const getMessages = messagingService.fetchMessages.bind(messagingService);
export const sendMessage = messagingService.sendMessage.bind(messagingService);
export const markAsRead = messagingService.markAsRead.bind(messagingService);
export const markConversationAsRead = messagingService.markConversationAsRead.bind(messagingService);
export const getUnreadCount = messagingService.getUnreadCount.bind(messagingService);

// Cleanup function for app-wide use
export const cleanupMessaging = () => {
  messagingService.cleanup();
};
