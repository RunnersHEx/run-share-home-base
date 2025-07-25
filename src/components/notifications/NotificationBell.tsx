
import { useState, useEffect } from "react";
import { Bell, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationList from "./NotificationList";

const NotificationBell = () => {
  const notificationData = useNotifications(); // Single instance of the hook
  const { unreadCount, loading, lastUpdate, connectionStatus } = notificationData;
  const [isOpen, setIsOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);

  // Force immediate display update when lastUpdate changes
  useEffect(() => {
    setDisplayCount(unreadCount);
  }, [lastUpdate]);

  // Additional force sync every time unreadCount actually changes
  useEffect(() => {
    setDisplayCount(unreadCount);
    
    // Force re-render with small delay
    setTimeout(() => {
      setDisplayCount(unreadCount);
    }, 50);
  }, [unreadCount]);

  // Listen for custom notification events to force immediate updates
  useEffect(() => {
    const handleNotificationRead = (event: any) => {
      setDisplayCount(event.detail.newUnreadCount);
    };

    const handleAllNotificationsRead = (event: any) => {
      setDisplayCount(0);
    };

    const handleUnreadCountChanged = (event: any) => {
      setDisplayCount(event.detail.count);
    };

    window.addEventListener('notificationRead', handleNotificationRead);
    window.addEventListener('allNotificationsRead', handleAllNotificationsRead);
    window.addEventListener('unreadCountChanged', handleUnreadCountChanged);

    return () => {
      window.removeEventListener('notificationRead', handleNotificationRead);
      window.removeEventListener('allNotificationsRead', handleAllNotificationsRead);
      window.removeEventListener('unreadCountChanged', handleUnreadCountChanged);
    };
  }, []);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <div className="relative">
            <Bell className="h-5 w-5" />
            {/* Connection status indicator */}
            {connectionStatus === 'disconnected' && (
              <WifiOff className="h-2 w-2 absolute -top-1 -left-1 text-red-500" />
            )}
          </div>
          {(() => {
            // Use the higher of unreadCount or displayCount to ensure indicator shows
            const finalCount = Math.max(unreadCount, displayCount);
            
            if (finalCount > 0) {
              return (
                <Badge 
                  key={`badge-${finalCount}-${lastUpdate}-${Date.now()}`} // Force re-render with unique key
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
                >
                  {finalCount > 99 ? '99+' : finalCount}
                </Badge>
              );
            }
            return null;
          })()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <NotificationList 
          onClose={() => setIsOpen(false)} 
          notificationData={notificationData} // Pass data as props
        />
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
