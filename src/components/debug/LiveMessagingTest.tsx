import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Send, MessageCircle, Wifi, WifiOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function LiveMessagingTest() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
    console.log(`[LiveMessagingTest] ${message}`);
  };

  // Load user's bookings
  useEffect(() => {
    if (!user?.id) return;

    const loadBookings = async () => {
      addLog('Loading user bookings...');
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          race:races(name),
          property:properties(title)
        `)
        .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`)
        .limit(10);

      if (error) {
        addLog(`Error loading bookings: ${error.message}`);
      } else {
        setBookings(data || []);
        addLog(`Loaded ${data?.length || 0} bookings`);
        
        // Auto-select first booking
        if (data && data.length > 0) {
          setSelectedBooking(data[0].id);
          addLog(`Auto-selected booking: ${data[0].id}`);
        }
      }
    };

    loadBookings();
  }, [user?.id]);

  // Load messages for selected booking
  useEffect(() => {
    if (!selectedBooking) return;

    const loadMessages = async () => {
      addLog(`Loading messages for booking: ${selectedBooking}`);
      
      const { data, error } = await supabase
        .from('booking_messages')
        .select(`
          *,
          sender:profiles!booking_messages_sender_id_profiles_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq('booking_id', selectedBooking)
        .order('created_at', { ascending: true });

      if (error) {
        addLog(`Error loading messages: ${error.message}`);
      } else {
        setMessages(data || []);
        addLog(`Loaded ${data?.length || 0} messages`);
      }
    };

    loadMessages();
  }, [selectedBooking]);

  // Real-time subscription
  useEffect(() => {
    if (!selectedBooking || !user?.id) return;

    addLog(`Setting up real-time subscription for booking: ${selectedBooking}`);
    
    const channel = supabase
      .channel(`live-test-${selectedBooking}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_messages',
          filter: `booking_id=eq.${selectedBooking}`,
        },
        async (payload) => {
          addLog(`🔥 REAL-TIME EVENT: ${payload.eventType || payload.event}`);
          addLog(`Event details: ${JSON.stringify(payload, null, 2)}`);
          
          if (payload.eventType === 'INSERT' || payload.new) {
            // Fetch complete message with sender info
            const { data: completeMessage, error } = await supabase
              .from('booking_messages')
              .select(`
                *,
                sender:profiles!booking_messages_sender_id_profiles_fkey(
                  id,
                  first_name,
                  last_name
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (!error && completeMessage) {
              addLog(`✅ Fetched complete message data`);
              setMessages(prev => {
                // Avoid duplicates
                const exists = prev.some(msg => msg.id === completeMessage.id);
                if (!exists) {
                  addLog(`📝 Added new message to state`);
                  return [...prev, completeMessage];
                }
                return prev;
              });
            } else {
              addLog(`❌ Failed to fetch complete message: ${error?.message}`);
            }
          }
        }
      )
      .subscribe((status) => {
        addLog(`Subscription status changed: ${status}`);
        setIsSubscribed(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          addLog('🎉 Successfully subscribed to real-time updates!');
        } else if (status === 'CHANNEL_ERROR') {
          addLog('❌ Real-time subscription failed');
        }
      });

    return () => {
      addLog('🧹 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [selectedBooking, user?.id]);

  const sendTestMessage = async () => {
    if (!selectedBooking || !user?.id || !newMessage.trim()) return;

    setSending(true);
    addLog(`Sending message: "${newMessage}"`);

    try {
      const { data, error } = await supabase
        .from('booking_messages')
        .insert({
          booking_id: selectedBooking,
          sender_id: user.id,
          message: newMessage.trim(),
          message_type: 'text'
        })
        .select()
        .single();

      if (error) {
        addLog(`❌ Failed to send message: ${error.message}`);
        toast.error('Failed to send message');
      } else {
        addLog(`✅ Message sent successfully: ${data.id}`);
        setNewMessage('');
        toast.success('Message sent!');
      }
    } catch (error) {
      addLog(`❌ Network error: ${error}`);
      toast.error('Network error');
    } finally {
      setSending(false);
    }
  };

  const sendQuickTestMessage = () => {
    setNewMessage(`Test message at ${new Date().toLocaleTimeString()}`);
    setTimeout(() => {
      sendTestMessage();
    }, 100);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isSubscribed ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <span>Live Messaging Test</span>
            <Badge className={isSubscribed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {isSubscribed ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel: Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Booking to Test:</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={selectedBooking}
                  onChange={(e) => setSelectedBooking(e.target.value)}
                >
                  <option value="">Select a booking...</option>
                  {bookings.map(booking => (
                    <option key={booking.id} value={booking.id}>
                      {booking.race?.name || booking.property?.title || booking.id}
                    </option>
                  ))}
                </select>
              </div>

              {selectedBooking && (
                <div className="space-y-4">
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Send Test Message:</h4>
                    <div className="flex space-x-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a test message..."
                        onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
                      />
                      <Button 
                        onClick={sendTestMessage}
                        disabled={!newMessage.trim() || sending}
                        size="sm"
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={sendQuickTestMessage}
                    disabled={sending}
                    className="w-full"
                    variant="outline"
                  >
                    Send Quick Test Message
                  </Button>

                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <strong>Instructions:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Open this page in 2 browser tabs</li>
                      <li>Select the same booking in both tabs</li>
                      <li>Send a message in one tab</li>
                      <li>It should appear instantly in the other tab</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel: Messages and Logs */}
            <div className="space-y-4">
              {/* Messages */}
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Messages ({messages.length})</span>
                </h4>
                <ScrollArea className="h-48 border rounded p-3">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-sm">No messages yet...</p>
                  ) : (
                    <div className="space-y-2">
                      {messages.map(message => (
                        <div key={message.id} className="bg-gray-50 p-2 rounded text-sm">
                          <div className="font-medium text-xs text-gray-600">
                            {message.sender?.first_name} {message.sender?.last_name} • {new Date(message.created_at).toLocaleTimeString()}
                          </div>
                          <div>{message.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Real-time Logs */}
              <div>
                <h4 className="font-medium mb-2">Real-time Activity Logs</h4>
                <ScrollArea className="h-48 border rounded p-3 bg-black text-green-400 font-mono text-xs">
                  {logs.length === 0 ? (
                    <p>No activity yet...</p>
                  ) : (
                    <div className="space-y-1">
                      {logs.map((log, index) => (
                        <div key={index}>{log}</div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Real-time Status Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              {user ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
              <span className="text-sm">User Authenticated</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {bookings.length > 0 ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
              <span className="text-sm">Bookings Loaded</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {selectedBooking ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
              <span className="text-sm">Booking Selected</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {isSubscribed ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
              <span className="text-sm">Real-time Connected</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LiveMessagingTest;