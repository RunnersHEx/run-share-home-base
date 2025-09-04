import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, AlertCircle, Info, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NotificationListProps {
  onClose: () => void;
  notificationData: {
    notifications: any[];
    loading: boolean;
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    connectionStatus: 'disconnected' | 'connecting' | 'connected';
    refetch: () => Promise<void>;
  };
}

const NotificationList = ({ onClose, notificationData }: NotificationListProps) => {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, connectionStatus, refetch } = notificationData;
  const navigate = useNavigate();

  const isBookingRelated = (type: string) => {
    const bookingTypes = [
      'booking_request_received',
      'booking_deadline_reminder', 
      'booking_accepted',
      'booking_rejected',
      'booking_confirmed',
      'booking_completed',
      'booking_cancelled'
    ];
    return bookingTypes.includes(type);
  };

  const handleNotificationClick = async (notification: any) => {
    // Use the same robust read detection logic
    const isRead = notification.read === true || notification.read === 'true' || notification.read === 1;
    
    if (!isRead) {
      await markAsRead(notification.id);
    }

    // Navigate to bookings section for booking-related notifications
    if (isBookingRelated(notification.type)) {
      onClose();
      navigate('/profile', { state: { activeSection: 'bookings' } });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'verification_update':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'verification_submitted':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'new_user_registered':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'verification_documents_submitted':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'booking_request_received':
      case 'booking_deadline_reminder':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'booking_accepted':
      case 'booking_confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'booking_rejected':
      case 'booking_cancelled':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'booking_completed':
        return <CheckCircle className="h-4 w-4 text-purple-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount > 0) {
      await markAllAsRead();
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Cargando notificaciones...
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="p-4 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs hover:bg-blue-50 flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              Marcar todas como leídas ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-96">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No tienes notificaciones
          </div>
        ) : (
          <div className="space-y-0">
            {notifications.map((notification, index) => (
              <div key={notification.id}>
                {(() => {
                  // Use robust read detection for styling
                  const isRead = notification.read === true || notification.read === 'true' || notification.read === 1;
                  
                  return (
                    <div
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !isRead ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                      }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                      <div className="flex items-start space-x-3">
                        {getIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${!isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDistanceToNow(new Date(notification.created_at), { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </p>
                        </div>
                        {!isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                    </div>
                  );
                })()}
                {index < notifications.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {notifications.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            {unreadCount > 0 
              ? `${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer`
              : 'Todas las notificaciones están leídas'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationList;
