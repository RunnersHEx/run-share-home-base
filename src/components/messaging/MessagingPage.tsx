import React, { useState } from 'react';
import { X, MessageCircle, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChat, useUnreadCount } from '@/hooks/useMessaging';
import ConversationList from './ConversationList';
import ChatInterface from './ChatInterface';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export function MessagingPage() {
  const [isMobileView, setIsMobileView] = useState(false);
  
  const {
    conversations,
    conversationsLoading,
    conversationsError,
    activeConversation,
    openConversation,
    closeConversation,
    markConversationAsRead,
    user,
    chatFilters,
    setChatFilters,
  } = useChat();

  const { unreadCount } = useUnreadCount();

  const handleConversationSelect = (conversation: any) => {
    openConversation(conversation);
    setIsMobileView(true);
  };

  const handleBackToList = () => {
    setIsMobileView(false);
    closeConversation();
  };

  const getFilteredConversations = (filter: string) => {
    switch (filter) {
      case 'unread':
        return conversations.filter(conv => {
          const unreadCount = conv.participant_1_id === user?.id 
            ? conv.unread_count_p1 
            : conv.unread_count_p2;
          return unreadCount > 0;
        });
      case 'recent':
        return conversations.filter(conv => {
          const daysSinceLastMessage = Math.floor(
            (new Date().getTime() - new Date(conv.last_message_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysSinceLastMessage <= 7;
        });
      default:
        return conversations;
    }
  };

  if (conversationsError) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Failed to load messages</h3>
              <p className="text-gray-600 mb-6">
                We couldn't load your conversations. Please try again.
              </p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
              <p className="text-gray-600">Chat with hosts and guests about your bookings</p>
            </div>
            
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadCount} unread
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversations.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
              <Badge className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                !
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getFilteredConversations('recent').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Messaging Interface */}
        <Card className="h-[600px]">
          <CardContent className="p-0 h-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
              {/* Conversation List - Hidden on mobile when chat is open */}
              <div className={`lg:col-span-1 border-r border-gray-200 h-full ${
                isMobileView ? 'hidden lg:block' : 'block'
              }`}>
                <Tabs defaultValue="all" className="h-full flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="all" onClick={() => setChatFilters({})}>
                        All
                      </TabsTrigger>
                      <TabsTrigger 
                        value="unread" 
                        onClick={() => setChatFilters({ status: 'unread' })}
                        className="relative"
                      >
                        Unread
                        {unreadCount > 0 && (
                          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[16px] h-4 flex items-center justify-center rounded-full">
                            {unreadCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="recent" 
                        onClick={() => setChatFilters({ status: 'recent' })}
                      >
                        Recent
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="all" className="flex-1 m-0">
                    <ConversationList
                      conversations={conversations}
                      activeConversationId={activeConversation?.id}
                      currentUserId={user?.id || ''}
                      onConversationSelect={handleConversationSelect}
                      onMarkAsRead={markConversationAsRead}
                      loading={conversationsLoading}
                    />
                  </TabsContent>
                  
                  <TabsContent value="unread" className="flex-1 m-0">
                    <ConversationList
                      conversations={getFilteredConversations('unread')}
                      activeConversationId={activeConversation?.id}
                      currentUserId={user?.id || ''}
                      onConversationSelect={handleConversationSelect}
                      onMarkAsRead={markConversationAsRead}
                      loading={conversationsLoading}
                    />
                  </TabsContent>
                  
                  <TabsContent value="recent" className="flex-1 m-0">
                    <ConversationList
                      conversations={getFilteredConversations('recent')}
                      activeConversationId={activeConversation?.id}
                      currentUserId={user?.id || ''}
                      onConversationSelect={handleConversationSelect}
                      onMarkAsRead={markConversationAsRead}
                      loading={conversationsLoading}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              {/* Chat Area */}
              <div className={`lg:col-span-2 h-full ${
                !isMobileView ? 'hidden lg:block' : 'block'
              }`}>
                {activeConversation ? (
                  <ChatInterface
                    bookingId={activeConversation.booking_id}
                    currentUserId={user?.id || ''}
                    onClose={handleBackToList}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-gray-500">
                        Choose a conversation from the list to start chatting
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Messaging Guidelines</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">For Guests:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Be respectful and communicate clearly</li>
                  <li>• Provide accurate arrival times</li>
                  <li>• Ask questions about the property or local area</li>
                  <li>• Confirm check-in details with your host</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">For Hosts:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Respond promptly to guest messages</li>
                  <li>• Provide helpful local running information</li>
                  <li>• Share check-in instructions clearly</li>
                  <li>• Be welcoming and professional</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default MessagingPage;
