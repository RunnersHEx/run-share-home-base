import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, MessageCircle } from 'lucide-react';
import { Conversation, ConversationListProps } from '@/types/messaging';

function formatLastMessageTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return date.toLocaleDateString('es-ES', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
}

function getUnreadCount(conversation: Conversation, currentUserId: string): number {
  return conversation.participant_1_id === currentUserId 
    ? conversation.unread_count_p1 
    : conversation.unread_count_p2;
}

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId: string;
  isActive: boolean;
  onClick: () => void;
  onMarkAsRead?: () => void;
}

function ConversationItem({ 
  conversation, 
  currentUserId, 
  isActive, 
  onClick,
  onMarkAsRead 
}: ConversationItemProps) {
  const unreadCount = getUnreadCount(conversation, currentUserId);
  const otherParticipant = conversation.other_participant;
  
  if (!otherParticipant) return null;

  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isActive ? 'bg-blue-50 border-r-2 border-r-blue-600' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={otherParticipant.profile_image_url || undefined} />
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {getInitials(otherParticipant.first_name, otherParticipant.last_name)}
            </AvatarFallback>
          </Avatar>
          
          {/* Online status indicator */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <h3 className={`font-semibold text-sm truncate ${
                unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
              }`}>
                {otherParticipant.first_name} {otherParticipant.last_name}
              </h3>
              
              {otherParticipant.verification_status === 'verified' && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 px-1 py-0">
                  ✓
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {formatLastMessageTime(conversation.last_message_at)}
              </span>
              
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>
          </div>

          {/* Booking info */}
          {conversation.booking && (
            <p className="text-xs text-blue-600 mb-1 truncate">
              {conversation.booking.race_name || 'Race Booking'}
            </p>
          )}

          {/* Last message preview */}
          <p className={`text-sm truncate ${
            unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-600'
          }`}>
            {conversation.last_message || 'No messages yet'}
          </p>

          {/* Rating */}
          {otherParticipant.average_rating && (
            <div className="flex items-center mt-1">
              <span className="text-xs text-yellow-600">
                ⭐ {otherParticipant.average_rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ConversationList({
  conversations,
  activeConversationId,
  currentUserId,
  onConversationSelect,
  onMarkAsRead,
  loading = false,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const participant = conversation.other_participant;
    if (!participant) return false;
    
    const fullName = `${participant.first_name} ${participant.last_name}`.toLowerCase();
    const raceName = conversation.booking?.race_name?.toLowerCase() || '';
    const propertyTitle = conversation.booking?.property_title?.toLowerCase() || '';
    
    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      raceName.includes(searchQuery.toLowerCase()) ||
      propertyTitle.includes(searchQuery.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Messages</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            {searchQuery ? (
              <div>
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No conversations found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div>
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No conversations yet</p>
                <p className="text-sm text-gray-400">
                  Start chatting with hosts and guests through your bookings
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                currentUserId={currentUserId}
                isActive={conversation.id === activeConversationId}
                onClick={() => onConversationSelect(conversation)}
                onMarkAsRead={() => onMarkAsRead?.(conversation.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          All conversations are secure and private
        </p>
      </div>
    </div>
  );
}

export default ConversationList;
