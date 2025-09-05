import { useState, useEffect, useRef } from "react";
import { RealtimeChannel } from '@supabase/supabase-js';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Shield, 
  Mail, 
  MailOpen,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminMessage {
  id: string;
  admin_name: string;
  message_type: 'deactivation' | 'activation' | 'warning' | 'general';
  title: string;
  message: string;
  reason: string | null;
  created_at: string;
  read_at: string | null;
}

interface AdminMessagesProps {
  userId: string;
  className?: string;
}

const AdminMessages = ({ userId, className = "" }: AdminMessagesProps) => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  const fetchAdminMessages = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_messages_for_user', {
        target_user_id: userId
      });

      if (error) {
        console.error('Error fetching admin messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching admin messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const { data, error } = await supabase.rpc('mark_admin_message_read', {
        message_id: messageId,
        target_user_id: userId
      });

      if (error) {
        console.error('Error marking message as read:', error);
        return;
      }

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, read_at: new Date().toISOString() }
          : msg
      ));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const openMessage = async (message: AdminMessage) => {
    setSelectedMessage(message);
    
    // Mark as read if not already read
    if (!message.read_at) {
      await markMessageAsRead(message.id);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'deactivation':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'activation':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'general':
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getMessageBadge = (type: string) => {
    switch (type) {
      case 'deactivation':
        return <Badge variant="destructive">Desactivación</Badge>;
      case 'activation':
        return <Badge className="bg-green-100 text-green-800">Activación</Badge>;
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-800">Advertencia</Badge>;
      case 'general':
      default:
        return <Badge variant="secondary">General</Badge>;
    }
  };

  const unreadCount = messages.filter(msg => !msg.read_at).length;

  // Setup real-time subscription
  const setupRealtimeSubscription = () => {
    if (!userId || channelRef.current) return;

    const channel = supabase
      .channel(`admin_messages_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_messages',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          if (!mountedRef.current) return;
          
          try {
            // Get admin name for the new message
            const { data: adminData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', payload.new.admin_id)
              .single();
            
            const newMessage: AdminMessage = {
              id: payload.new.id,
              admin_name: adminData 
                ? `${adminData.first_name || ''} ${adminData.last_name || ''}`.trim() || 'Administrador'
                : 'Administrador',
              message_type: payload.new.message_type,
              title: payload.new.title,
              message: payload.new.message,
              reason: payload.new.reason,
              created_at: payload.new.created_at,
              read_at: payload.new.read_at
            };

            // Add the new message to the beginning of the list
            setMessages(prev => [newMessage, ...prev]);
            
            // Show toast notification
            toast.info(
              `Nuevo mensaje del administrador: ${newMessage.title}`, 
              {
                description: 'Ve a mensajes para ver el contenido completo.',
                duration: 5000
              }
            );
          } catch (error) {
            console.error('Error processing real-time admin message:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', 
          schema: 'public',
          table: 'admin_messages',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (!mountedRef.current) return;
          
          // Update the message (typically for read_at changes)
          setMessages(prev => prev.map(msg => 
            msg.id === payload.new.id 
              ? { ...msg, read_at: payload.new.read_at }
              : msg
          ));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Admin messages real-time subscription active for user:', userId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Admin messages subscription error for user:', userId);
        }
      });

    channelRef.current = channel;
  };

  // Cleanup real-time subscription
  const cleanupRealtimeSubscription = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    
    if (userId) {
      fetchAdminMessages();
      setupRealtimeSubscription();
    }
    
    return () => {
      mountedRef.current = false;
      cleanupRealtimeSubscription();
    };
  }, [userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanupRealtimeSubscription();
    };
  }, []);

  if (loading) {
    return (
      <div className={`${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className={`${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Mensajes del Administrador</span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount} nuevos
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tienes mensajes del administrador</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      !message.read_at ? 'bg-blue-50 border-blue-200' : 'border-muted'
                    }`}
                    onClick={() => openMessage(message)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getMessageIcon(message.message_type)}
                        <span className="font-medium text-sm">{message.title}</span>
                        {!message.read_at && (
                          <Mail className="h-3 w-3 text-blue-600" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {getMessageBadge(message.message_type)}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.created_at), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {message.message}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        De: {message.admin_name}
                      </span>
                      {message.read_at ? (
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <MailOpen className="h-3 w-3" />
                          <span>Leído</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Clock className="h-3 w-3" />
                          <span>Nuevo</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Message Detail Modal */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedMessage && getMessageIcon(selectedMessage.message_type)}
              <span>{selectedMessage?.title}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>De: {selectedMessage.admin_name}</span>
                <div className="flex items-center space-x-4">
                  {getMessageBadge(selectedMessage.message_type)}
                  <span>
                    {formatDistanceToNow(new Date(selectedMessage.created_at), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedMessage.message}
                </div>
              </div>

              {selectedMessage.reason && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Motivo específico:</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedMessage.reason}
                  </p>
                </div>
              )}

              <div className="text-xs text-muted-foreground text-center pt-4 border-t">
                Si tienes preguntas sobre este mensaje, contacta al equipo de soporte.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminMessages;