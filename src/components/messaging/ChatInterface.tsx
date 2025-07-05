import React, { useState, useEffect, useRef } from 'react';
import { Send, MoreVertical, ArrowLeft, Phone, Video, Info, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMessages, useTypingIndicator } from '@/hooks/useMessaging';
import { ChatInterfaceProps } from '@/types/messaging';
import { toast } from 'sonner';

function formatMessageTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  
  return date.toLocaleDateString('es-ES', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
}

interface TypingIndicatorProps {
  userName: string;
}

function TypingIndicator({ userName }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-xs text-gray-500">{userName} is typing...</span>
        </div>
      </div>
    </div>
  );
}

export function ChatInterface({ 
  bookingId, 
  currentUserId, 
  onClose, 
  className = '' 
}: ChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    loading: messagesLoading,
    sending,
    error: messagesError,
    sendMessage,
    messagesEndRef,
  } = useMessages(bookingId);

  const {
    typingUsers,
    handleTyping,
    stopTyping,
  } = useTypingIndicator(bookingId);

  // Get other participant info from first message
  const otherParticipant = messages.find(msg => msg.sender_id !== currentUserId)?.sender;

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return;

    try {
      await sendMessage({
        booking_id: bookingId,
        message: message.trim(),
        message_type: 'text',
      });
      setMessage('');
      stopTyping();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    handleTyping();
  };

  if (messagesError) {
    return (
      <div className={`flex flex-col h-[600px] bg-white rounded-lg border border-gray-200 shadow-lg ${className}`}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load conversation</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-[600px] bg-white rounded-lg border border-gray-200 shadow-lg ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          {otherParticipant && (
            <>
              <Avatar className="h-10 w-10">
                <AvatarImage src={otherParticipant.profile_image_url || undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {getInitials(otherParticipant.first_name, otherParticipant.last_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900">
                    {otherParticipant.first_name} {otherParticipant.last_name}
                  </h3>
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                    Online
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Booking conversation
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Info className="h-4 w-4 mr-2" />
                View Booking Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                Report Conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isOwnMessage = msg.sender_id === currentUserId;
                const showAvatar = !isOwnMessage && (
                  index === 0 || 
                  messages[index - 1].sender_id !== msg.sender_id
                );

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${
                      !isOwnMessage && !showAvatar ? 'ml-12' : ''
                    }`}
                  >
                    {!isOwnMessage && showAvatar && (
                      <Avatar className="h-8 w-8 mr-3 mt-1">
                        <AvatarImage src={msg.sender?.profile_image_url || undefined} />
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                          {getInitials(msg.sender?.first_name || '', msg.sender?.last_name || '')}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`max-w-[70%] ${isOwnMessage ? 'ml-auto' : ''}`}>
                      <div
                        className={`p-3 rounded-lg ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <p
                        className={`text-xs text-gray-500 mt-1 ${
                          isOwnMessage ? 'text-right' : 'text-left'
                        }`}
                      >
                        {formatMessageTime(msg.created_at)}
                        {isOwnMessage && msg.read_at && (
                          <span className="ml-1 text-blue-500">✓</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing Indicators */}
            {typingUsers.map((user) => (
              <TypingIndicator key={user.user_id} userName={user.user_name} />
            ))}

            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="pr-12"
              disabled={sending}
            />
            
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sending}
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}

export default ChatInterface;
