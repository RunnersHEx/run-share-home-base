import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
  user_id: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const mountedRef = useRef(true);
  const userRef = useRef(user);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const lastFetchRef = useRef(0);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('connected'); // Default to connected

  const MAX_RETRY_ATTEMPTS = 3; // Reduced from 5
  const BASE_RETRY_DELAY = 5000; // Increased to 5 seconds
  const MAX_RETRY_DELAY = 30000; // 30 seconds
  const POLLING_INTERVAL = 15000; // Poll every 15 seconds

  // Keep userRef up to date
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const updateUnreadCount = useCallback((newCount: number) => {
    setUnreadCount(newCount);
    setLastUpdate(Date.now());
    
    // Force immediate update
    setTimeout(() => {
      setUnreadCount(newCount);
    }, 0);
    
    // Dispatch global event to force all UI updates
    window.dispatchEvent(new CustomEvent('unreadCountChanged', { 
      detail: { count: newCount, timestamp: Date.now() } 
    }));
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id || !mountedRef.current) {
      if (mountedRef.current) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
      }
      return;
    }

    // Prevent too frequent fetches
    const now = Date.now();
    if (now - lastFetchRef.current < 1000) {
      return;
    }
    lastFetchRef.current = now;

    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!mountedRef.current) return;

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }
      
      const userNotifications = (data || []).filter(n => n.user_id === user.id);

      if (mountedRef.current) {
        setNotifications(userNotifications);
        
        const unread = userNotifications.filter(n => {
          const isRead = n.read === true || n.read === 'true' || n.read === 1;
          return !isRead;
        }).length;
        
        updateUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't show toast for every fetch error to avoid spam
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user?.id, updateUnreadCount]);

  const markAsRead = async (notificationId: string) => {
    if (!user || !mountedRef.current) return;
    
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) {
      return;
    }
    
    const isCurrentlyRead = notification.read === true || notification.read === 'true' || notification.read === 1;
    
    if (isCurrentlyRead) {
      return;
    }

    // Optimistic update
    const newNotifications = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    
    const newUnreadCount = Math.max(0, unreadCount - 1);
    
    setNotifications(newNotifications);
    updateUnreadCount(newUnreadCount);
    
    // Dispatch custom events
    window.dispatchEvent(new CustomEvent('notificationRead', { 
      detail: { notificationId, newUnreadCount } 
    }));

    // Update database
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Database update failed:', error);
        // Revert optimistic update
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error updating database:', error);
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (!user || !mountedRef.current) return;
    
    if (unreadCount === 0) {
      toast.info('No hay notificaciones sin leer');
      return;
    }

    // Optimistic update
    const newNotifications = notifications.map(n => 
      n.user_id === user.id ? { ...n, read: true } : n
    );
    
    setNotifications(newNotifications);
    updateUnreadCount(0);
    
    // Dispatch custom events
    window.dispatchEvent(new CustomEvent('allNotificationsRead', { 
      detail: { newUnreadCount: 0 } 
    }));

    // Update database
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Database update failed:', error);
        fetchNotifications();
      } else {
        toast.success('Todas las notificaciones marcadas como leídas');
      }
    } catch (error) {
      console.error('Error updating database:', error);
      fetchNotifications();
    }
  };

  // Cleanup function for subscription
  const cleanupSubscription = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    if (channelRef.current) {
      try {
        // Properly unsubscribe before removing
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        // Ignore cleanup errors
      }
      channelRef.current = null;
    }
  }, []);

  // Cleanup polling
  const cleanupPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Optional WebSocket subscription setup (enhancement only)
  const setupSubscription = useCallback((userId: string) => {
    if (!userId || !mountedRef.current) {
      return;
    }

    // Clean up any existing subscription
    cleanupSubscription();
    
    try {
      const channelName = `notifications-${userId}-${Date.now()}`;
      
      const channel = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: false },
            presence: { key: userId },
            private: false
          }
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            if (!mountedRef.current || !userRef.current?.id) return;
            
            // Debounce to prevent rapid fires
            setTimeout(() => {
              if (mountedRef.current && userRef.current?.id === userId) {
                fetchNotifications();
              }
            }, 500);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            if (!mountedRef.current || !userRef.current?.id) return;
            
            // Debounce to prevent rapid fires
            setTimeout(() => {
              if (mountedRef.current && userRef.current?.id === userId) {
                fetchNotifications();
              }
            }, 300);
          }
        )
        .subscribe((status, err) => {
          if (!mountedRef.current) return;
          
          switch (status) {
            case 'SUBSCRIBED':
              // WebSocket connected - this is a bonus, but don't change main status
              break;
              
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
            case 'CLOSED':
              // WebSocket failed - that's okay, polling will handle it
              // Only retry a few times quietly
              if (reconnectAttempts.current < MAX_RETRY_ATTEMPTS) {
                const retryDelay = Math.min(
                  BASE_RETRY_DELAY * Math.pow(2, reconnectAttempts.current),
                  MAX_RETRY_DELAY
                );
                
                reconnectAttempts.current++;
                
                retryTimeoutRef.current = setTimeout(() => {
                  if (mountedRef.current && userRef.current?.id === userId) {
                    setupSubscription(userId);
                  }
                }, retryDelay);
              }
              // If max retries reached, just give up on WebSocket - polling continues
              break;
              
            default:
              break;
          }
        });

      channelRef.current = channel;
      
    } catch (error) {
      // WebSocket setup failed - that's fine, polling will handle notifications
      if (reconnectAttempts.current < MAX_RETRY_ATTEMPTS) {
        const retryDelay = Math.min(
          BASE_RETRY_DELAY * Math.pow(2, reconnectAttempts.current),
          MAX_RETRY_DELAY
        );
        
        reconnectAttempts.current++;
        
        retryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current && userRef.current?.id === userId) {
            setupSubscription(userId);
          }
        }, retryDelay);
      }
    }
  }, [cleanupSubscription, fetchNotifications]);

  // Start reliable HTTP polling
  const startPolling = useCallback((userId: string) => {
    if (!userId || !mountedRef.current) return;
    
    cleanupPolling();
    
    // Initial fetch
    fetchNotifications();
    
    // Set up regular polling
    pollingIntervalRef.current = setInterval(() => {
      if (mountedRef.current && userRef.current?.id === userId) {
        fetchNotifications().catch(() => {
          // Only show disconnected if HTTP polling fails
          setConnectionStatus('disconnected');
        });
      }
    }, POLLING_INTERVAL);
  }, [fetchNotifications, cleanupPolling]);

  // Effect for starting notifications (polling + optional WebSocket)
  useEffect(() => {
    if (!user?.id) {
      cleanupSubscription();
      cleanupPolling();
      setConnectionStatus('connected'); // Reset status
      return;
    }

    // Start with reliable polling
    startPolling(user.id);
    
    // Try WebSocket as enhancement (with delay to avoid conflicts)
    setTimeout(() => {
      if (mountedRef.current && user?.id) {
        setupSubscription(user.id);
      }
    }, 1000);

    return () => {
      cleanupSubscription();
      cleanupPolling();
    };
  }, [user?.id, startPolling, setupSubscription, cleanupSubscription, cleanupPolling]);

  // Effect for component mount/unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      cleanupSubscription();
      cleanupPolling();
    };
  }, [cleanupSubscription, cleanupPolling]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
    lastUpdate,
    connectionStatus
  };
};
