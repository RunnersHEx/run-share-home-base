import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

export function RealtimeConnectionTest() {
  const { user } = useAuth();
  const [logs, setLogs] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isListening, setIsListening] = useState(false);
  const channelRef = useRef<any>(null);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type];
    
    setLogs(prev => `[${timestamp}] ${emoji} ${message}\n${prev}`);
  };

  const testBasicConnection = async () => {
    addLog('Testing basic Supabase connection...', 'info');
    
    try {
      const { data, error } = await supabase.from('booking_messages').select('count').limit(1);
      if (error) {
        addLog(`Basic connection failed: ${error.message}`, 'error');
      } else {
        addLog('Basic Supabase connection successful', 'success');
      }
    } catch (error: any) {
      addLog(`Basic connection error: ${error.message}`, 'error');
    }
  };

  const testRealtimeConnection = () => {
    if (isListening) {
      // Stop listening
      if (channelRef.current) {
        addLog('Stopping realtime listener...', 'info');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsListening(false);
      setConnectionStatus('disconnected');
      return;
    }

    if (!user?.id) {
      addLog('No authenticated user found', 'error');
      return;
    }

    addLog('Starting realtime connection test...', 'info');
    setIsListening(true);

    // Create a simple channel just to test connectivity
    const channel = supabase
      .channel('realtime-test', {
        config: {
          broadcast: { self: true },
          presence: { key: `test-user-${user.id}` }
        }
      })
      .on('broadcast', { event: 'test' }, (payload) => {
        addLog(`Received broadcast: ${JSON.stringify(payload)}`, 'success');
      })
      .on('presence', { event: 'sync' }, () => {
        addLog('Presence sync received', 'success');
      })
      .subscribe((status, error) => {
        addLog(`Channel subscription status: ${status}`, status === 'SUBSCRIBED' ? 'success' : 'warning');
        setConnectionStatus(status);
        
        if (error) {
          addLog(`Subscription error: ${JSON.stringify(error)}`, 'error');
        }
        
        if (status === 'SUBSCRIBED') {
          addLog('✨ Realtime connection successful! Testing broadcast...', 'success');
          
          // Test broadcast
          setTimeout(() => {
            channel.send({
              type: 'broadcast',
              event: 'test',
              payload: { message: 'Hello from client!', timestamp: Date.now() }
            });
          }, 1000);
        } else if (status === 'TIMED_OUT') {
          addLog('❌ Realtime connection timed out. This suggests network/firewall issues or Supabase realtime is disabled.', 'error');
        } else if (status === 'CLOSED') {
          addLog('Connection closed', 'warning');
        }
      });

    channelRef.current = channel;
  };

  const testMessageTableRealtime = () => {
    if (!user?.id) {
      addLog('No authenticated user found', 'error');
      return;
    }

    addLog('Testing booking_messages table realtime...', 'info');

    const channel = supabase
      .channel('messages-table-test')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_messages'
        },
        (payload) => {
          addLog(`Message table change detected: ${JSON.stringify(payload)}`, 'success');
        }
      )
      .subscribe((status, error) => {
        addLog(`Messages table subscription status: ${status}`, status === 'SUBSCRIBED' ? 'success' : 'warning');
        
        if (error) {
          addLog(`Messages subscription error: ${JSON.stringify(error)}`, 'error');
        }
        
        if (status === 'SUBSCRIBED') {
          addLog('✨ Messages table realtime subscription active!', 'success');
        }
      });

    // Clean up after 30 seconds
    setTimeout(() => {
      supabase.removeChannel(channel);
      addLog('Messages table test subscription ended', 'info');
    }, 30000);
  };

  const insertTestMessage = async () => {
    if (!user?.id) {
      addLog('No authenticated user found', 'error');
      return;
    }

    addLog('Finding a real booking to test with...', 'info');

    try {
      // First, find a real booking for this user
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`)
        .limit(1);

      if (bookingError || !bookings || bookings.length === 0) {
        addLog('No bookings found for user. Cannot test with real booking ID.', 'warning');
        addLog('Try creating a booking first, or use the Database Debug tab to create a test conversation.', 'info');
        return;
      }

      const bookingId = bookings[0].id;
      addLog(`Using real booking ID: ${bookingId}`, 'info');
      addLog('Inserting test message to trigger realtime...', 'info');

      const { data, error } = await supabase
        .from('booking_messages')
        .insert({
          booking_id: bookingId,
          sender_id: user.id,
          message: 'Test message for realtime - ' + new Date().toISOString(),
          message_type: 'text'
        })
        .select()
        .single();

      if (error) {
        addLog(`Failed to insert test message: ${error.message}`, 'error');
      } else {
        addLog(`✅ Test message inserted with ID: ${data.id}`, 'success');
        addLog('🎯 If realtime is working, you should see a message table change notification above!', 'success');
      }
    } catch (error: any) {
      addLog(`Test message insertion error: ${error.message}`, 'error');
    }
  };

  const checkRealtimeConfig = async () => {
    addLog('Checking Supabase realtime configuration...', 'info');
    
    try {
      // Check if we can see realtime config (this might not work depending on permissions)
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'booking_messages')
        .limit(1);
        
      if (error) {
        addLog(`Could not check table info: ${error.message}`, 'warning');
      } else {
        addLog('booking_messages table exists', 'success');
      }
      
      // Test RLS by trying to read a message
      const { data: messages, error: msgError } = await supabase
        .from('booking_messages')
        .select('id')
        .limit(1);
        
      if (msgError) {
        addLog(`RLS/Permission issue: ${msgError.message}`, 'error');
        addLog('This could prevent realtime from working', 'warning');
      } else {
        addLog('Can read booking_messages table - permissions OK', 'success');
      }
    } catch (error: any) {
      addLog(`Config check error: ${error.message}`, 'error');
    }
  };

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const clearLogs = () => setLogs('');

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🔧 Realtime Connection Debugger</span>
          <div className="flex items-center gap-2">
            <Badge variant={connectionStatus === 'SUBSCRIBED' ? 'default' : 'destructive'}>
              {connectionStatus}
            </Badge>
            {user && (
              <Badge variant="outline">
                User: {user.email}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Button onClick={testBasicConnection} variant="outline" size="sm">
            Test Basic Connection
          </Button>
          <Button 
            onClick={testRealtimeConnection} 
            variant={isListening ? "destructive" : "default"}
            size="sm"
          >
            {isListening ? 'Stop' : 'Test'} Realtime
          </Button>
          <Button onClick={testMessageTableRealtime} variant="outline" size="sm">
            Test Messages Table
          </Button>
          <Button onClick={insertTestMessage} variant="outline" size="sm">
            Insert Test Message
          </Button>
          <Button onClick={checkRealtimeConfig} variant="outline" size="sm">
            Check Config
          </Button>
          <Button onClick={clearLogs} variant="outline" size="sm">
            Clear Logs
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">How to use:</h4>
          <ol className="text-sm space-y-1">
            <li>1. Click "Test Basic Connection" to ensure Supabase works</li>
            <li>2. Click "Test Realtime" to check WebSocket connectivity</li>
            <li>3. Click "Test Messages Table" to check table-specific realtime</li>
            <li>4. Click "Insert Test Message" while table test is running</li>
            <li>5. Check the logs below for any errors or timeouts</li>
          </ol>
        </div>

        {/* Debug Logs */}
        <div>
          <h4 className="font-semibold mb-2">Debug Logs:</h4>
          <Textarea
            value={logs}
            readOnly
            className="font-mono text-xs h-96"
            placeholder="Test results will appear here..."
          />
        </div>

        {/* Common Issues */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Common Issues & Solutions:</h4>
          <ul className="text-sm space-y-1">
            <li><strong>TIMED_OUT:</strong> Firewall/network blocking WebSockets or Supabase Realtime disabled</li>
            <li><strong>CLOSED:</strong> Connection lost, usually network related</li>
            <li><strong>Permission errors:</strong> RLS policies preventing realtime access</li>
            <li><strong>Table not found:</strong> booking_messages not enabled for realtime in dashboard</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
