import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MoreVertical, ArrowLeft, Info, Check, CheckCheck, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMessaging } from '@/hooks/useMessaging';
import { ChatInterfaceProps } from '@/types/messaging';
import { getUserInitials } from '@/utils/messagingUtils';

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function formatMessageTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
  
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatDetailedTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString();
  
  if (isToday) {
    return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  } else if (isYesterday) {
    return `Yesterday ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}

function getInitials(firstName: string, lastName: string) {
  return getUserInitials({ first_name: firstName, last_name: lastName });
}

// ==========================================
// COMPONENTS
// ==========================================

function MessageStatusIcon({ message, isOwnMessage }: { message: any; isOwnMessage: boolean }) {
  if (!isOwnMessage) return null;
  
  if (message.read_at) {
    return <CheckCheck className="h-3 w-3 text-blue-500" />;
  } else {
    return <Check className="h-3 w-3 text-gray-400" />;
  }
}

function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center justify-center my-6">
      <div className="bg-gray-100 rounded-full px-3 py-1">
        <span className="text-xs text-gray-600 font-medium">
          {formatDetailedTime(date).split(' ')[0]}
        </span>
      </div>
    </div>
  );
}

function ErrorDisplay({ error, onRetry, onClear }: { 
  error: any; 
  onRetry: () => void; 
  onClear: () => void;
}) {
  return (
    <Alert className="mx-4 mb-4 border-red-200 bg-red-50">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-700">
        <div className="flex items-center justify-between">
          <span>{error.message}</span>
          <div className="flex gap-2 ml-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="h-7 px-3 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClear}
              className="h-7 px-3 text-xs"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-gray-500 text-sm">Loading messages...</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="bg-white rounded-2xl p-8 shadow-sm max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Send className="h-8 w-8 text-white" />
        </div>
        <p className="text-gray-600 text-lg font-medium mb-2">Start the conversation!</p>
        <p className="text-gray-500 text-sm">Say hello and introduce yourself.</p>
      </div>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function ChatInterface({ 
  bookingId, 
  currentUserId, 
  onClose, 
  className = '',
  otherParticipant: propOtherParticipant
}: ChatInterfaceProps) {
  const [messageInput, setMessageInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Use simplified messaging hook
  const {
    messages,
    loading,
    sending,
    error,
    hasMoreMessages,
    sendMessage,
    loadMoreMessages,
    refresh,
    clearError,
    messagesEndRef,
    markConversationAsRead
  } = useMessaging(bookingId);

  // Get other participant info - use prop first, then fallback to messages
  const otherParticipant = propOtherParticipant || messages.find(msg => msg.sender_id !== currentUserId)?.sender;

  // Force component to update when conversation/participant changes
  const [participantKey, setParticipantKey] = useState(0);
  useEffect(() => {
    if (propOtherParticipant) {
      setParticipantKey(prev => prev + 1);
    }
  }, [propOtherParticipant?.id, bookingId]);

  // Memoize the display name to ensure it updates when participant changes
  const participantDisplayName = React.useMemo(() => {
    if (!otherParticipant) return '';
    return `${otherParticipant.first_name || 'Unknown'} ${otherParticipant.last_name || 'User'}`;
  }, [otherParticipant?.first_name, otherParticipant?.last_name, otherParticipant?.id, participantKey]);

  // Debug: log participant changes
  useEffect(() => {
    if (otherParticipant) {
      console.log('ChatInterface: otherParticipant updated:', {
        firstName: otherParticipant.first_name,
        lastName: otherParticipant.last_name,
        id: otherParticipant.id,
        bookingId,
        displayName: participantDisplayName,
        participantKey
      });
    }
  }, [otherParticipant?.id, otherParticipant?.first_name, otherParticipant?.last_name, bookingId, participantDisplayName, participantKey]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesEndRef]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Mark conversation as read when ChatInterface opens
  useEffect(() => {
    if (bookingId && currentUserId && markConversationAsRead) {
      markConversationAsRead(bookingId);
    }
  }, [bookingId, currentUserId, markConversationAsRead]);
  
  // Group messages by date and consecutive sender
  const groupedMessages = React.useMemo(() => {
    const groups: any[] = [];
    let currentGroup: any = null;
    let lastDate = '';
    
    messages.forEach((msg, index) => {
      const msgDate = new Date(msg.created_at).toDateString();
      const isOwnMessage = msg.sender_id === currentUserId;
      const prevMsg = messages[index - 1];
      const isConsecutive = prevMsg && 
        prevMsg.sender_id === msg.sender_id && 
        new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 5 * 60 * 1000; // 5 minutes
      
      // Add date divider if date changed
      if (msgDate !== lastDate) {
        groups.push({ type: 'date', date: msg.created_at });
        lastDate = msgDate;
      }
      
      // Start new group or add to existing
      if (!isConsecutive || !currentGroup || currentGroup.isOwnMessage !== isOwnMessage) {
        currentGroup = {
          type: 'messages',
          isOwnMessage,
          sender: msg.sender,
          messages: [msg],
          timestamp: msg.created_at
        };
        groups.push(currentGroup);
      } else {
        currentGroup.messages.push(msg);
        currentGroup.timestamp = msg.created_at;
      }
    });
    
    return groups;
  }, [messages, currentUserId]);

  // Handle send message
  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || sending) return;

    const messageToSend = messageInput;
    setMessageInput(''); // Clear immediately for better UX
    
    try {
      await sendMessage(messageToSend);
    } catch (error) {
      // Error is handled by the hook
      setMessageInput(messageToSend); // Restore message on error
    }
  }, [messageInput, sending, sendMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
  };

  const handleViewBookingDetails = () => {
    navigate(`/booking/${bookingId}`);
  };

  const handleLoadMore = () => {
    if (hasMoreMessages && !loading) {
      loadMoreMessages();
    }
  };

  const handleRetry = () => {
    refresh();
  };

  return (
    <div className={`flex flex-col bg-white overflow-hidden ${className}`} style={{ height: '100%' }}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white backdrop-blur-sm sticky top-0 flex-shrink-0">
        <div className="flex items-center space-x-3">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden hover:bg-gray-100 rounded-full p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          
          {otherParticipant && (
            <>
              <div className="relative">
                <Avatar className="h-11 w-11 ring-2 ring-white shadow-sm">
                  <AvatarImage src={otherParticipant.profile_image_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {getInitials(otherParticipant.first_name, otherParticipant.last_name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {participantDisplayName}
                  </h3>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" onClick={refresh} className="rounded-full hover:bg-gray-100">
            <RefreshCw className={`h-4 w-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full hover:bg-gray-100">
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="cursor-pointer" onClick={handleViewBookingDetails}>
                <Info className="h-4 w-4 mr-2" />
                View Booking Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <ErrorDisplay 
          error={error} 
          onRetry={handleRetry} 
          onClear={clearError} 
        />
      )}

      {/* Messages Area */}
      <div className="flex-1 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-gray-25 to-gray-50 opacity-50 pointer-events-none"></div>
        <div 
          className="absolute inset-0 overflow-y-auto"
          ref={containerRef}
        >
          <div className="flex flex-col p-4 pb-2">
            {/* Load More Button */}
            {hasMoreMessages && (
              <div className="flex justify-center mb-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="rounded-full"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    'Load earlier messages'
                  )}
                </Button>
              </div>
            )}

            {loading && messages.length === 0 ? (
              <LoadingState />
            ) : messages.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-1">
                {groupedMessages.map((group, groupIndex) => {
                  if (group.type === 'date') {
                    return <DateDivider key={`date-${groupIndex}`} date={group.date} />;
                  }
                  
                  return (
                    <div key={`group-${groupIndex}`} className={`flex ${group.isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
                      {/* Avatar for received messages */}
                      {!group.isOwnMessage && (
                        <div className="flex-shrink-0 mr-3">
                          <Avatar className="h-8 w-8 shadow-sm">
                            <AvatarImage src={group.sender?.profile_image_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-600 text-white text-xs">
                              {getInitials(group.sender?.first_name || '', group.sender?.last_name || '')}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                      
                      <div className={`flex flex-col space-y-1 max-w-[75%] ${group.isOwnMessage ? 'items-end' : 'items-start'}`}>
                        {group.messages.map((msg: any, msgIndex: number) => {
                          const isFirst = msgIndex === 0;
                          const isLast = msgIndex === group.messages.length - 1;
                          const isOptimistic = msg.id.startsWith('temp-');
                          
                          return (
                            <div key={msg.id} className="group relative">
                              <div
                                className={`px-4 py-2.5 max-w-md break-words transition-all duration-200 hover:shadow-md ${
                                  group.isOwnMessage
                                    ? `bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg
                                       ${isOptimistic ? 'opacity-70' : ''}
                                       ${isFirst && isLast ? 'rounded-2xl' : ''}
                                       ${isFirst && !isLast ? 'rounded-2xl rounded-br-md' : ''}
                                       ${!isFirst && isLast ? 'rounded-2xl rounded-tr-md' : ''}
                                       ${!isFirst && !isLast ? 'rounded-xl rounded-tr-md rounded-br-md' : ''}`
                                    : `bg-white text-gray-800 shadow-sm border border-gray-100
                                       ${isFirst && isLast ? 'rounded-2xl' : ''}
                                       ${isFirst && !isLast ? 'rounded-2xl rounded-bl-md' : ''}
                                       ${!isFirst && isLast ? 'rounded-2xl rounded-tl-md' : ''}
                                       ${!isFirst && !isLast ? 'rounded-xl rounded-tl-md rounded-bl-md' : ''}`
                                }`}
                              >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                {isOptimistic && (
                                  <div className="flex items-center mt-1">
                                    <Loader2 className="h-3 w-3 animate-spin text-current opacity-70" />
                                    <span className="text-xs ml-1 opacity-70">Sending...</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Timestamp and status for last message in group */}
                              {isLast && !isOptimistic && (
                                <div className={`flex items-center space-x-1 mt-1 px-1 ${
                                  group.isOwnMessage ? 'justify-end' : 'justify-start'
                                }`}>
                                  <span className="text-xs text-gray-500">
                                    {formatMessageTime(msg.created_at)}
                                  </span>
                                  <MessageStatusIcon message={msg} isOwnMessage={group.isOwnMessage} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} className="h-1 w-full" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <div className={`relative rounded-2xl border transition-all duration-200 ${
              isInputFocused 
                ? 'border-blue-300 shadow-lg ring-4 ring-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <Input
                ref={inputRef}
                value={messageInput}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder="Type a message..."
                className="border-0 rounded-2xl py-3 pr-12 pl-4 text-sm bg-transparent focus:ring-0 focus:outline-none resize-none"
                disabled={sending}
                maxLength={2000}
              />
            </div>
            
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sending}
              size="sm"
              className={`absolute right-2 bottom-2 h-8 w-8 p-0 rounded-full transition-all duration-200 ${
                messageInput.trim() && !sending
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg scale-100' 
                  : 'bg-gray-300 hover:bg-gray-400 scale-95'
              }`}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-400">
            Press Enter to send • Shift + Enter for new line
          </p>
          <p className="text-xs text-gray-400">
            {messageInput.length}/2000
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
