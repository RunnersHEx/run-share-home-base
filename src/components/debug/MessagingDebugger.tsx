import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { RefreshCw, MessageCircle, Database, Send, Wifi } from 'lucide-react';
import { RealtimeConnectionTest } from './RealtimeConnectionTest';

export function MessagingDebugger() {
  const { user } = useAuth();
  const [debug, setDebug] = useState({
    conversations: [],
    messages: [],
    bookings: [],
    profiles: [],
    loading: false,
    error: null
  });
  const [testBookingId, setTestBookingId] = useState('');
  const [testMessage, setTestMessage] = useState('Test message from debugger');
  const [testResults, setTestResults] = useState('');

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => `[${timestamp}] ${message}\n${prev}`);
  };

  const runDebugQuery = async (query: string, params: any[] = []) => {
    try {
      addDebugLog(`Executing: ${query}`);
      const { data, error } = await supabase.rpc('execute_sql', { sql: query, params });
      if (error) {
        addDebugLog(`❌ Error: ${error.message}`);
        return null;
      }
      addDebugLog(`✅ Success: ${data?.length || 0} rows`);
      return data;
    } catch (error: any) {
      addDebugLog(`❌ Exception: ${error.message}`);
      return null;
    }
  };

  const fetchDebugData = async () => {
    if (!user?.id) {
      addDebugLog('❌ No user authenticated');
      return;
    }

    setDebug(prev => ({ ...prev, loading: true, error: null }));
    addDebugLog('🔍 Starting debug data fetch...');

    try {
      // Check conversations
      addDebugLog('📞 Fetching conversations...');
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`);
      
      if (convError) {
        addDebugLog(`❌ Conversations error: ${convError.message}`);
      } else {
        addDebugLog(`✅ Found ${conversations?.length || 0} conversations`);
      }

      // Check all conversations (admin view)
      const { data: allConversations, error: allConvError } = await supabase
        .from('conversations')
        .select('*')
        .limit(10);
      
      if (!allConvError) {
        addDebugLog(`📊 Total conversations in DB: ${allConversations?.length || 0}`);
      }

      // Check messages  
      addDebugLog('💬 Fetching messages...');
      const { data: messages, error: msgError } = await supabase
        .from('booking_messages')
        .select('*')
        .limit(10);
      
      if (msgError) {
        addDebugLog(`❌ Messages error: ${msgError.message}`);
      } else {
        addDebugLog(`✅ Found ${messages?.length || 0} messages`);
      }

      // Check bookings for current user
      addDebugLog('📅 Fetching user bookings...');
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id, guest_id, host_id, status, created_at')
        .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`)
        .limit(10);
      
      if (bookingError) {
        addDebugLog(`❌ Bookings error: ${bookingError.message}`);
      } else {
        addDebugLog(`✅ Found ${bookings?.length || 0} bookings for user`);
        bookings?.forEach((booking: any) => {
          const role = booking.guest_id === user.id ? 'guest' : 'host';
          addDebugLog(`  📝 Booking ${booking.id} (${role}) - ${booking.status}`);
        });
      }

      // Check profiles
      addDebugLog('👤 Checking profiles...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        addDebugLog(`❌ Profile error: ${profileError.message}`);
      } else {
        addDebugLog(`✅ Profile found: ${profile?.first_name} ${profile?.last_name}`);
      }

      // Test unread count function
      addDebugLog('🔢 Testing unread count function...');
      const { data: unreadCount, error: unreadError } = await supabase
        .rpc('get_user_unread_count', { p_user_id: user.id });
      
      if (unreadError) {
        addDebugLog(`❌ Unread count error: ${unreadError.message}`);
      } else {
        addDebugLog(`✅ Unread count: ${unreadCount}`);
      }

      setDebug({
        conversations: conversations || [],
        messages: messages || [],
        bookings: bookings || [],
        profiles: profile ? [profile] : [],
        loading: false,
        error: null
      });

    } catch (error: any) {
      addDebugLog(`❌ Debug fetch failed: ${error.message}`);
      setDebug(prev => ({ ...prev, loading: false, error: error.message }));
    }
  };

  const testSendMessage = async () => {
    if (!testBookingId || !testMessage || !user?.id) {
      toast.error('Please fill in booking ID and message');
      return;
    }

    addDebugLog(`📤 Attempting to send test message to booking ${testBookingId}`);
    
    try {
      const { data, error } = await supabase
        .from('booking_messages')
        .insert({
          booking_id: testBookingId,
          sender_id: user.id,
          message: testMessage,
          message_type: 'text'
        })
        .select('*')
        .single();

      if (error) {
        addDebugLog(`❌ Send message error: ${error.message}`);
        toast.error(`Failed to send: ${error.message}`);
      } else {
        addDebugLog(`✅ Message sent successfully: ${data.id}`);
        toast.success('Message sent!');
        // Refresh debug data
        await fetchDebugData();
      }
    } catch (error: any) {
      addDebugLog(`❌ Send message exception: ${error.message}`);
      toast.error(`Exception: ${error.message}`);
    }
  };

  const createTestConversation = async () => {
    if (!testBookingId || !user?.id) {
      toast.error('Please enter a booking ID');
      return;
    }

    addDebugLog(`📞 Creating test conversation for booking ${testBookingId}`);
    
    try {
      // First check if booking exists and get participants
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, guest_id, host_id')
        .eq('id', testBookingId)
        .single();

      if (bookingError) {
        addDebugLog(`❌ Booking not found: ${bookingError.message}`);
        toast.error('Booking not found');
        return;
      }

      addDebugLog(`✅ Booking found: guest=${booking.guest_id}, host=${booking.host_id}`);

      // Create conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          booking_id: testBookingId,
          participant_1_id: booking.guest_id,
          participant_2_id: booking.host_id
        })
        .select('*')
        .single();

      if (error) {
        addDebugLog(`❌ Create conversation error: ${error.message}`);
        toast.error(`Failed to create conversation: ${error.message}`);
      } else {
        addDebugLog(`✅ Conversation created: ${data.id}`);
        toast.success('Conversation created!');
        await fetchDebugData();
      }
    } catch (error: any) {
      addDebugLog(`❌ Create conversation exception: ${error.message}`);
      toast.error(`Exception: ${error.message}`);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchDebugData();
    }
  }, [user?.id]);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Please log in to use the messaging debugger</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Messaging System Debugger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="database" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="database" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Database Debug
              </TabsTrigger>
              <TabsTrigger value="realtime" className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Realtime Debug
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="database" className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Button onClick={fetchDebugData} disabled={debug.loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${debug.loading ? 'animate-spin' : ''}`} />
                  Refresh Debug Data
                </Button>
                <Badge variant="outline">
                  User: {user.email}
                </Badge>
              </div>

              {debug.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-700">Error: {debug.error}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Database Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Conversations:</span>
                      <Badge>{debug.conversations.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Messages:</span>
                      <Badge>{debug.messages.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>User Bookings:</span>
                      <Badge>{debug.bookings.length}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Test Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Booking ID:</label>
                      <Input
                        value={testBookingId}
                        onChange={(e) => setTestBookingId(e.target.value)}
                        placeholder="Enter booking ID to test"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Test Message:</label>
                      <Input
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        placeholder="Test message text"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={createTestConversation} size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Create Conversation
                      </Button>
                      <Button onClick={testSendMessage} size="sm">
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Debug Log</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={testResults}
                    readOnly
                    className="font-mono text-xs h-64"
                    placeholder="Debug logs will appear here..."
                  />
                  <Button
                    onClick={() => setTestResults('')}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Clear Log
                  </Button>
                </CardContent>
              </Card>

              {debug.conversations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Conversations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                      {JSON.stringify(debug.conversations, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {debug.bookings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Bookings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                      {JSON.stringify(debug.bookings, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="realtime" className="mt-4">
              <RealtimeConnectionTest />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}