import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Wifi, WifiOff, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface DebugResult {
  test: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: any;
}

export function RealtimeDebugger() {
  const { user } = useAuth();
  const [results, setResults] = useState<DebugResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  const addResult = (result: DebugResult) => {
    setResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setResults([]);
  };

  // Test 1: Check Supabase Connection
  const testSupabaseConnection = async () => {
    addResult({ test: 'Supabase Connection', status: 'loading', message: 'Testing connection...' });
    
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      
      if (error) {
        addResult({ 
          test: 'Supabase Connection', 
          status: 'error', 
          message: `Connection failed: ${error.message}`,
          details: error
        });
      } else {
        addResult({ 
          test: 'Supabase Connection', 
          status: 'success', 
          message: 'Connection successful'
        });
      }
    } catch (error) {
      addResult({ 
        test: 'Supabase Connection', 
        status: 'error', 
        message: `Network error: ${error}`,
        details: error
      });
    }
  };

  // Test 2: Check Authentication
  const testAuthentication = async () => {
    addResult({ test: 'User Authentication', status: 'loading', message: 'Checking auth status...' });
    
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        addResult({ 
          test: 'User Authentication', 
          status: 'error', 
          message: `Auth error: ${error.message}`,
          details: error
        });
      } else if (!authUser) {
        addResult({ 
          test: 'User Authentication', 
          status: 'warning', 
          message: 'No authenticated user found'
        });
      } else {
        addResult({ 
          test: 'User Authentication', 
          status: 'success', 
          message: `Authenticated as ${authUser.email}`,
          details: { userId: authUser.id }
        });
      }
    } catch (error) {
      addResult({ 
        test: 'User Authentication', 
        status: 'error', 
        message: `Auth check failed: ${error}`,
        details: error
      });
    }
  };

  // Test 3: Check Messaging Tables
  const testMessagingTables = async () => {
    addResult({ test: 'Messaging Tables', status: 'loading', message: 'Checking table access...' });
    
    try {
      // Test conversations table
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .limit(1);
      
      if (convError) {
        addResult({ 
          test: 'Messaging Tables', 
          status: 'error', 
          message: `Conversations table error: ${convError.message}`,
          details: convError
        });
        return;
      }
      
      // Test booking_messages table
      const { data: messages, error: msgError } = await supabase
        .from('booking_messages')
        .select('id')
        .limit(1);
      
      if (msgError) {
        addResult({ 
          test: 'Messaging Tables', 
          status: 'error', 
          message: `Messages table error: ${msgError.message}`,
          details: msgError
        });
        return;
      }
      
      addResult({ 
        test: 'Messaging Tables', 
        status: 'success', 
        message: 'Both messaging tables accessible',
        details: { 
          conversations: conversations?.length || 0, 
          messages: messages?.length || 0 
        }
      });
    } catch (error) {
      addResult({ 
        test: 'Messaging Tables', 
        status: 'error', 
        message: `Table access failed: ${error}`,
        details: error
      });
    }
  };

  // Test 4: Check Real-time Subscription
  const testRealtimeSubscription = async () => {
    if (!user?.id) {
      addResult({ 
        test: 'Real-time Subscription', 
        status: 'warning', 
        message: 'Cannot test - no authenticated user'
      });
      return;
    }

    addResult({ test: 'Real-time Subscription', status: 'loading', message: 'Testing real-time connection...' });
    
    try {
      let subscriptionWorking = false;
      let timeoutId: NodeJS.Timeout;
      
      const channel = supabase
        .channel('debug-test')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'booking_messages',
          },
          (payload) => {
            subscriptionWorking = true;
            clearTimeout(timeoutId);
            
            addResult({ 
              test: 'Real-time Subscription', 
              status: 'success', 
              message: 'Real-time subscription working!',
              details: payload
            });
            
            supabase.removeChannel(channel);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            addResult({ 
              test: 'Real-time Subscription', 
              status: 'success', 
              message: 'Successfully subscribed to real-time updates'
            });
            
            // Test by inserting a dummy message if user has bookings
            testRealtimeWithDummyMessage();
          } else if (status === 'CHANNEL_ERROR') {
            addResult({ 
              test: 'Real-time Subscription', 
              status: 'error', 
              message: 'Failed to subscribe to real-time updates'
            });
          }
        });
      
      // Timeout after 10 seconds
      timeoutId = setTimeout(() => {
        if (!subscriptionWorking) {
          addResult({ 
            test: 'Real-time Subscription', 
            status: 'error', 
            message: 'Real-time subscription timeout - no events received'
          });
          supabase.removeChannel(channel);
        }
      }, 10000);
      
    } catch (error) {
      addResult({ 
        test: 'Real-time Subscription', 
        status: 'error', 
        message: `Subscription error: ${error}`,
        details: error
      });
    }
  };

  const testRealtimeWithDummyMessage = async () => {
    if (!user?.id) return;
    
    try {
      // Get user's first booking to test with
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`)
        .limit(1);
      
      if (bookingError || !bookings || bookings.length === 0) {
        addResult({ 
          test: 'Real-time Test Message', 
          status: 'warning', 
          message: 'No bookings found to test real-time messaging'
        });
        return;
      }
      
      // Insert a test message
      const { error: insertError } = await supabase
        .from('booking_messages')
        .insert({
          booking_id: bookings[0].id,
          sender_id: user.id,
          message: `Debug test message - ${new Date().toISOString()}`,
          message_type: 'system'
        });
      
      if (insertError) {
        addResult({ 
          test: 'Real-time Test Message', 
          status: 'error', 
          message: `Failed to insert test message: ${insertError.message}`,
          details: insertError
        });
      }
    } catch (error) {
      addResult({ 
        test: 'Real-time Test Message', 
        status: 'error', 
        message: `Test message error: ${error}`,
        details: error
      });
    }
  };

  // Test 5: Check User's Bookings
  const testUserBookings = async () => {
    if (!user?.id) {
      addResult({ 
        test: 'User Bookings', 
        status: 'warning', 
        message: 'Cannot test - no authenticated user'
      });
      return;
    }

    addResult({ test: 'User Bookings', status: 'loading', message: 'Checking user bookings...' });
    
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('id, status, guest_id, host_id')
        .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`);
      
      if (error) {
        addResult({ 
          test: 'User Bookings', 
          status: 'error', 
          message: `Bookings query error: ${error.message}`,
          details: error
        });
      } else {
        const bookingCount = bookings?.length || 0;
        
        if (bookingCount === 0) {
          addResult({ 
            test: 'User Bookings', 
            status: 'warning', 
            message: 'No bookings found - messaging requires active bookings'
          });
        } else {
          addResult({ 
            test: 'User Bookings', 
            status: 'success', 
            message: `Found ${bookingCount} booking(s)`,
            details: bookings
          });
        }
      }
    } catch (error) {
      addResult({ 
        test: 'User Bookings', 
        status: 'error', 
        message: `Bookings check failed: ${error}`,
        details: error
      });
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();
    
    try {
      await testSupabaseConnection();
      await testAuthentication();
      await testMessagingTables();
      await testUserBookings();
      await testRealtimeSubscription();
    } catch (error) {
      console.error('Test suite error:', error);
      toast.error('Test suite encountered an error');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: DebugResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'loading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: DebugResult['status']) => {
    const variants = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      loading: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <Badge className={variants[status]}>
        {status}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            {connectionStatus === 'connected' ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <span>Real-time Messaging Debugger</span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center space-x-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
            </Button>
            
            <Button 
              onClick={clearResults} 
              variant="outline"
              disabled={isRunning}
            >
              Clear Results
            </Button>
          </div>
          
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Test Results:</h3>
              
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.test}</span>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                  
                  <p className="text-sm text-gray-600">{result.message}</p>
                  
                  {result.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Troubleshooting Tips:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Ensure you have active bookings to test messaging</li>
              <li>• Check browser console for JavaScript errors</li>
              <li>• Verify Supabase project settings allow real-time</li>
              <li>• Make sure Row Level Security policies are correctly configured</li>
              <li>• Try refreshing the page and running tests again</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RealtimeDebugger;