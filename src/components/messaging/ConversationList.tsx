import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, MessageCircle, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import type { Conversation } from '@/hooks/useMessaging';

// ==========================================
// TYPES
// ==========================================

interface ConversationListFixedProps {
  conversations: Conversation[];
  activeConversationId?: string;
  currentUserId: string;
  onConversationSelect: (conversation: Conversation) => void;
  onMarkAsRead?: (conversationId: string) => void;
  loading?: boolean;
  error?: any;
  onRefresh?: () => void;
  onClearError?: () => void;
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function formatLastMessageTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-US', { 
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

// ==========================================
// COMPONENTS
// ==========================================

function ErrorDisplay({ error, onRetry, onClear }: { 
  error: any; 
  onRetry?: () => void; 
  onClear?: () => void; 
}) {
  return (
    <Alert className="m-4 border-red-200 bg-red-50">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-700">
        <div className="flex items-center justify-between">
          <span className="text-sm">{error.message || 'Failed to load conversations'}</span>
          <div className="flex gap-2 ml-4">
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="h-7 px-3 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
            {onClear && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClear}
                className="h-7 px-3 text-xs"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

function LoadingState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-gray-500 text-sm">Loading conversations...</p>
      </div>
    </div>
  );
}

function EmptyState({ searchQuery }: { searchQuery: string }) {
  if (searchQuery) {
    return (
      <div className="p-8 text-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm max-w-sm mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium mb-2">No matches found</p>
          <p className="text-gray-500 text-sm">No conversations found matching "{searchQuery}"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 text-center">
      <div className="bg-white rounded-2xl p-8 shadow-sm max-w-sm mx-auto">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <MessageCircle className="h-8 w-8 text-blue-600" />
        </div>
        <p className="text-gray-600 font-medium mb-2">No conversations yet</p>
        <p className="text-sm text-gray-500">
          Start chatting with hosts and guests through your bookings
        </p>
      </div>
    </div>
  );
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
      className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-all duration-200 ${
        isActive ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-r-4 border-r-blue-500 shadow-sm' : 'hover:shadow-sm'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="relative">
          <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
            <AvatarImage src={otherParticipant.profile_image_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {getInitials(otherParticipant.first_name, otherParticipant.last_name)}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <h3 className={`font-semibold text-sm truncate transition-colors ${
                unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
              }`}>
                {otherParticipant.first_name} {otherParticipant.last_name}
              </h3>
              
              {otherParticipant.verification_status === 'verified' && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 px-2 py-0.5 border border-green-200">
                  ✓
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`text-xs transition-colors ${
                unreadCount > 0 ? 'text-blue-600 font-medium' : 'text-gray-500'
              }`}>
                {formatLastMessageTime(conversation.last_message_at)}
              </span>
              
              {unreadCount > 0 && (
                <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full shadow-md animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>
          </div>

          {/* Booking info */}
          {conversation.booking && (
            <div className="flex items-center space-x-1 mb-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-xs text-blue-600 font-medium truncate">
                {conversation.booking.race_name || 'Race Booking'}
              </p>
            </div>
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
              <div className="flex items-center space-x-1 bg-yellow-50 rounded-full px-2 py-0.5">
                <span className="text-xs text-yellow-600">⭐</span>
                <span className="text-xs text-yellow-700 font-medium">
                  {otherParticipant.average_rating.toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function ConversationList({
  conversations,
  activeConversationId,
  currentUserId,
  onConversationSelect,
  onMarkAsRead,
  loading = false,
  error,
  onRefresh,
  onClearError
}: ConversationListFixedProps) {
  const [searchQuery, setSearchQuery] = useState('');

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

  if (loading && conversations.length === 0) {
    return <LoadingState />;
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <span>Messages</span>
          </h2>
          
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRefresh}
              className="rounded-full hover:bg-gray-100"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200 rounded-xl"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <ErrorDisplay 
          error={error} 
          onRetry={onRefresh} 
          onClear={onClearError} 
        />
      )}

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <EmptyState searchQuery={searchQuery} />
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
      <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-xs text-gray-500 text-center font-medium">
            All conversations are secure and private
          </p>
        </div>
      </div>
    </div>
  );
}

export default ConversationList;
