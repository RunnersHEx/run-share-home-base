
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
  user_id: string; // Añadir user_id para verificación
}

export const useNotifications = () => {
  const { user } = useAuth();
  const mountedRef = useRef(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) {
      if (mountedRef.current) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
      }
      return;
    }

    try {
      console.log('Fetching notifications for user:', user.id);
      
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id) // CRÍTICO: Filtrar por user_id
        .order('created_at', { ascending: false });

      if (!mountedRef.current) return;

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      console.log('Fetched notifications:', data);
      
      // Verificar que todas las notificaciones pertenecen al usuario actual
      const userNotifications = (data || []).filter(n => n.user_id === user.id);
      
      if (userNotifications.length !== (data || []).length) {
        console.warn('Filtered out notifications that do not belong to current user');
      }

      if (mountedRef.current) {
        setNotifications(userNotifications);
        const unread = userNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
        
        console.log('Unread count:', unread);
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
  };

  const markAsRead = async (notificationId: string) => {
    if (!user || !mountedRef.current) return;

    try {
      console.log('Marking notification as read:', notificationId);
      
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id); // CRÍTICO: Verificar que pertenece al usuario

      if (!mountedRef.current) return;

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }

      // Actualizar estado local
      if (mountedRef.current) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        
        // Actualizar contador
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        console.log('Notification marked as read successfully');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      if (mountedRef.current) {
        toast.error('Error al marcar como leída');
      }
    }
  };

  const markAllAsRead = async () => {
    if (!user || !mountedRef.current) return;

    try {
      console.log('Marking all notifications as read for user:', user.id);
      
      // Primero obtener las notificaciones no leídas del usuario
      const unreadNotifications = notifications.filter(n => !n.read && n.user_id === user.id);
      
      if (unreadNotifications.length === 0) {
        console.log('No unread notifications to mark');
        if (mountedRef.current) {
          toast.info('No hay notificaciones sin leer');
        }
        return;
      }

      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('user_id', user.id) // CRÍTICO: Solo del usuario actual
        .eq('read', false); // Solo las no leídas

      if (!mountedRef.current) return;

      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }

      // Actualizar estado local
      if (mountedRef.current) {
        setNotifications(prev => 
          prev.map(n => n.user_id === user.id ? { ...n, read: true } : n)
        );
        
        // Resetear contador
        setUnreadCount(0);
        
        console.log('All notifications marked as read successfully');
        toast.success('Todas las notificaciones marcadas como leídas');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      if (mountedRef.current) {
        toast.error('Error al marcar todas como leídas');
      }
    }
  };

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!user || !mountedRef.current) return;

    const channel = supabase
      .channel('user-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}` // CRÍTICO: Solo escuchar cambios del usuario actual
        },
        (payload) => {
          console.log('Real-time notification change:', payload);
          // Refrescar notificaciones cuando hay cambios
          if (mountedRef.current) {
            fetchNotifications();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications();
    
    return () => {
      mountedRef.current = false;
    };
  }, [user]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
};
