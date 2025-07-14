import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Users, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMessaging, useUnreadCount } from '@/hooks/useMessaging';
import { useAuth } from '@/contexts/AuthContext';
import ConversationList from './ConversationList';
import ChatInterface from './ChatInterface';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// ==========================================
// TYPES
// ==========================================

interface ActiveConversation {
  id: string;
  booking_id: string;
  other_participant?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image_url?: string;
  };
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function MessagingPage() {
  const { user } = useAuth();
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeConversation, setActiveConversation] = useState<ActiveConversation | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const mountedRef = useRef(true);
  
  // Use simplified messaging hooks
  const {
    conversations,
    loading: conversationsLoading,
    error: conversationsError,
    refresh: refreshConversations,
    clearError: clearConversationsError,
    markConversationAsRead
  } = useMessaging(); // No bookingId = conversations mode

  const { unreadCount, refresh: refreshUnreadCount } = useUnreadCount();
  
  // Component cleanup
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Filter conversations based on active tab
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

  const currentConversations = getFilteredConversations(activeTab);

  // Handle conversation selection
  const handleConversationSelect = async (conversation: any) => {
    if (!mountedRef.current) return;
    
    console.log('MessagingPage: Selecting conversation:', {
      id: conversation.id,
      bookingId: conversation.booking_id,
      otherParticipant: conversation.other_participant
    });
    
    setActiveConversation({
      id: conversation.id,
      booking_id: conversation.booking_id,
      other_participant: conversation.other_participant
    });
    setIsMobileView(true);
    
    // Mark conversation as read immediately when opened
    if (markConversationAsRead) {
      await markConversationAsRead(conversation.booking_id);
    }
    
    // Refresh unread count after marking as read
    setTimeout(() => {
      refreshUnreadCount();
      // Also refresh conversations to update unread counts in the list
      refreshConversations();
    }, 500);
  };

  const handleBackToList = () => {
    if (!mountedRef.current) return;
    
    setIsMobileView(false);
    setActiveConversation(null);
    
    // Refresh data when returning to list
    refreshConversations();
    refreshUnreadCount();
  };

  const handleMarkAsRead = async (conversationId: string) => {
    // The individual message components handle marking as read
    // Just refresh the unread count
    setTimeout(() => {
      refreshUnreadCount();
    }, 500);
  };

  const handleRefreshAll = () => {
    refreshConversations();
    refreshUnreadCount();
  };

  // Critical error state
  if (conversationsError && conversationsError.type === 'permission') {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <div className="mb-2">
                <strong>Access Denied</strong>
              </div>
              <p>You don't have permission to access the messaging system. Please contact support if you believe this is an error.</p>
            </AlertDescription>
          </Alert>
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
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white">
                  {unreadCount} unread
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshAll}
                disabled={conversationsLoading}
              >
                Refresh
              </Button>
            </div>
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
        <Card className="h-[calc(100vh-400px)] min-h-[600px] max-h-[800px]">
          <CardContent className="p-0 h-full overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
              {/* Conversation List - Hidden on mobile when chat is open */}
              <div className={`lg:col-span-1 border-r border-gray-200 h-full ${
                isMobileView ? 'hidden lg:block' : 'block'
              }`}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="all">
                        All ({conversations.length})
                      </TabsTrigger>
                      <TabsTrigger value="unread" className="relative">
                        Unread
                        {unreadCount > 0 && (
                          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[16px] h-4 flex items-center justify-center rounded-full">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="recent">
                        Recent ({getFilteredConversations('recent').length})
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="all" className="flex-1 m-0">
                    <ConversationList
                      conversations={currentConversations}
                      activeConversationId={activeConversation?.id}
                      currentUserId={user?.id || ''}
                      onConversationSelect={handleConversationSelect}
                      onMarkAsRead={handleMarkAsRead}
                      loading={conversationsLoading}
                      error={conversationsError}
                      onRefresh={refreshConversations}
                      onClearError={clearConversationsError}
                    />
                  </TabsContent>
                  
                  <TabsContent value="unread" className="flex-1 m-0">
                    <ConversationList
                      conversations={currentConversations}
                      activeConversationId={activeConversation?.id}
                      currentUserId={user?.id || ''}
                      onConversationSelect={handleConversationSelect}
                      onMarkAsRead={handleMarkAsRead}
                      loading={conversationsLoading}
                      error={conversationsError}
                      onRefresh={refreshConversations}
                      onClearError={clearConversationsError}
                    />
                  </TabsContent>
                  
                  <TabsContent value="recent" className="flex-1 m-0">
                    <ConversationList
                      conversations={currentConversations}
                      activeConversationId={activeConversation?.id}
                      currentUserId={user?.id || ''}
                      onConversationSelect={handleConversationSelect}
                      onMarkAsRead={handleMarkAsRead}
                      loading={conversationsLoading}
                      error={conversationsError}
                      onRefresh={refreshConversations}
                      onClearError={clearConversationsError}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              {/* Chat Area */}
              <div className={`lg:col-span-2 h-full ${
                !isMobileView ? 'hidden lg:block' : 'block'
              }`}>
                {activeConversation ? (
                  <div className="h-full overflow-hidden">
                    <ChatInterface
                      bookingId={activeConversation.booking_id}
                      currentUserId={user?.id || ''}
                      onClose={handleBackToList}
                      otherParticipant={activeConversation.other_participant}
                    />
                  </div>
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
