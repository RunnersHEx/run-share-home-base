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
  const userRef = useRef(user); // Keep a ref to current user
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

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
    if (!user) {
      if (mountedRef.current) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!mountedRef.current) return;

      if (error) {
        throw error;
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
      if (mountedRef.current) {
        toast.error('Error al cargar notificaciones');
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, updateUnreadCount]);

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
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.error('Error removing channel:', error);
      }
      channelRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    setConnectionStatus('disconnected');
  }, []);

  // Enhanced subscription setup with retry logic
  const setupSubscription = useCallback((userId: string, retryCount = 0) => {
    const maxRetries = 3;
    
    // Clean up existing subscription
    cleanupSubscription();

    if (!mountedRef.current) {
      return;
    }

    try {
      setConnectionStatus('connecting');
      const channelName = `user-notifications-${userId}-${Date.now()}`;
      
      const channel = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: false },
            presence: { key: userId }
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
            if (mountedRef.current && payload.eventType === 'INSERT') {
              // Delay to ensure database consistency
              setTimeout(() => {
                if (mountedRef.current && userRef.current?.id) {
                  // Fetch notifications directly to avoid dependency issues
                  supabase
                    .from('user_notifications')
                    .select('*')
                    .eq('user_id', userRef.current.id)
                    .order('created_at', { ascending: false })
                    .then(({ data, error }) => {
                      if (!error && mountedRef.current && data) {
                        const userNotifications = data.filter(n => n.user_id === userRef.current!.id);
                        setNotifications(userNotifications);
                        const unread = userNotifications.filter(n => {
                          const isRead = n.read === true || n.read === 'true' || n.read === 1;
                          return !isRead;
                        }).length;
                        updateUnreadCount(unread);
                      }
                    })
                    .catch(err => console.error('Real-time fetch error:', err));
                }
              }, 300);
            }
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
            if (mountedRef.current && payload.eventType === 'UPDATE') {
              // Handle read status updates
              const updatedNotification = payload.new as Notification;
              if (updatedNotification && updatedNotification.user_id === userId) {
                setNotifications(prev => 
                  prev.map(n => 
                    n.id === updatedNotification.id ? updatedNotification : n
                  )
                );
                
                // Recalculate unread count
                setTimeout(() => {
                  if (mountedRef.current && userRef.current?.id) {
                    supabase
                      .from('user_notifications')
                      .select('*')
                      .eq('user_id', userRef.current.id)
                      .order('created_at', { ascending: false })
                      .then(({ data, error }) => {
                        if (!error && mountedRef.current && data) {
                          const userNotifications = data.filter(n => n.user_id === userRef.current!.id);
                          setNotifications(userNotifications);
                          const unread = userNotifications.filter(n => {
                            const isRead = n.read === true || n.read === 'true' || n.read === 1;
                            return !isRead;
                          }).length;
                          updateUnreadCount(unread);
                        }
                      })
                      .catch(err => console.error('Real-time update fetch error:', err));
                  }
                }, 100);
              }
            }
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Subscription error:', status, err);
            setConnectionStatus('disconnected');
            
            // Retry connection if within limits and component is still mounted
            if (retryCount < maxRetries && mountedRef.current) {
              const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
              
              retryTimeoutRef.current = setTimeout(() => {
                if (mountedRef.current) {
                  setupSubscription(userId, retryCount + 1);
                }
              }, retryDelay);
            } else {
              if (retryCount >= maxRetries) {
                toast.error('Conexión de notificaciones perdida. Refresca la página si no ves nuevas notificaciones.');
              }
            }
          } else if (status === 'CLOSED') {
            setConnectionStatus('disconnected');
            
            // Only retry on CLOSED if component is still mounted and it seems like an unexpected closure
            // Don't retry if this is likely a normal cleanup
            if (mountedRef.current && retryCount === 0) {
              const retryDelay = 3000; // 3 second delay for CLOSED status
              
              retryTimeoutRef.current = setTimeout(() => {
                if (mountedRef.current) {
                  setupSubscription(userId, 1); // Mark as retry attempt 1
                }
              }, retryDelay);
            }
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('Error setting up notification subscription:', error);
      setConnectionStatus('disconnected');
      
      // Retry on setup error
      if (retryCount < maxRetries && mountedRef.current) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        retryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setupSubscription(userId, retryCount + 1);
          }
        }, retryDelay);
      }
    }
  }, [cleanupSubscription]); // Remove user dependency to prevent recreation

  // Effect for real-time subscription - with stable dependencies
  useEffect(() => {
    if (!user?.id) {
      cleanupSubscription();
      return;
    }

    setupSubscription(user.id);

    return () => {
      cleanupSubscription();
    };
  }, [user?.id]); // Only depend on user.id to avoid recreating subscription

  // Effect for fetching notifications - separate from subscription
  useEffect(() => {
    mountedRef.current = true;
    
    if (user?.id) {
      fetchNotifications();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [user?.id]);

  // Periodic refetch as fallback (every 60 seconds when connected)
  useEffect(() => {
    if (!user || connectionStatus !== 'connected') return;

    const interval = setInterval(() => {
      if (mountedRef.current && connectionStatus === 'connected') {
        // Call fetchNotifications directly to avoid dependency issues
        if (user?.id) {
          supabase
            .from('user_notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
              if (!error && mountedRef.current && data) {
                const userNotifications = data.filter(n => n.user_id === user.id);
                setNotifications(userNotifications);
                const unread = userNotifications.filter(n => {
                  const isRead = n.read === true || n.read === 'true' || n.read === 1;
                  return !isRead;
                }).length;
                updateUnreadCount(unread);
              }
            })
            .catch(err => console.error('Periodic fetch error:', err));
        }
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [user?.id, connectionStatus, updateUnreadCount]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
    lastUpdate,
    connectionStatus // Export connection status for debugging
  };
};
