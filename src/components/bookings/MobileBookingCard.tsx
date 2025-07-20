import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Star, 
  Shield, 
  Phone, 
  MessageSquare,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  ChevronRight
} from "lucide-react";
import { Booking } from "@/types/booking";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface MobileBookingCardProps {
  booking: Booking;
  onRespond?: (bookingId: string, response: 'accepted' | 'rejected') => void;
  onMessage?: (booking: Booking) => void;
  onCancel?: (bookingId: string, cancelledBy: 'guest' | 'host') => void;
  onConfirm?: (bookingId: string) => void;
  onComplete?: (bookingId: string) => void;
  compact?: boolean;
}

const MobileBookingCard = ({ 
  booking, 
  onRespond, 
  onMessage, 
  onCancel, 
  onConfirm, 
  onComplete,
  compact = false 
}: MobileBookingCardProps) => {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const isHost = user?.id === booking.host_id;
  const isGuest = user?.id === booking.guest_id;
  const otherUser = isHost ? booking.guest : booking.host;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        text: 'Pendiente'
      },
      accepted: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        text: 'Aceptada'
      },
      rejected: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        text: 'Rechazada'
      },
      confirmed: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Calendar,
        text: 'Confirmada'
      },
      completed: {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: CheckCircle,
        text: 'Completada'
      },
      cancelled: {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: XCircle,
        text: 'Cancelada'
      }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getTimeRemaining = () => {
    if (booking.status !== 'pending') return null;
    
    const deadline = new Date(booking.host_response_deadline);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    if (diffHours <= 0) return { text: 'Expirado', urgent: true };
    if (diffHours < 6) return { text: `${diffHours}h`, urgent: true };
    if (diffHours < 24) return { text: `${diffHours}h`, urgent: true };
    return { text: `${Math.ceil(diffHours / 24)}d`, urgent: false };
  };

  const statusConfig = getStatusConfig(booking.status);
  const StatusIcon = statusConfig.icon;
  const timeRemaining = getTimeRemaining();

  const availableActions = [];
  
  // Determine available actions based on status and user role
  if (booking.status === 'pending' && isHost && onRespond) {
    availableActions.push(
      { label: 'Aceptar', action: () => onRespond(booking.id, 'accepted'), variant: 'default' as const },
      { label: 'Rechazar', action: () => onRespond(booking.id, 'rejected'), variant: 'destructive' as const }
    );
  }
  
  if (['accepted', 'confirmed'].includes(booking.status) && onMessage) {
    availableActions.push(
      { label: 'Mensaje', action: () => onMessage(booking), variant: 'outline' as const }
    );
  }
  
  if (booking.status === 'accepted' && isHost && onConfirm) {
    availableActions.push(
      { label: 'Confirmar', action: () => onConfirm(booking.id), variant: 'default' as const }
    );
  }
  
  if (booking.status === 'confirmed' && isHost && onComplete) {
    availableActions.push(
      { label: 'Completar', action: () => onComplete(booking.id), variant: 'default' as const }
    );
  }
  
  if (['pending', 'accepted'].includes(booking.status) && onCancel) {
    const cancelledBy = isHost ? 'host' : 'guest';
    availableActions.push(
      { label: 'Cancelar', action: () => onCancel(booking.id, cancelledBy), variant: 'destructive' as const }
    );
  }

  if (compact) {
    return (
      <Card className="mb-3 border-l-4 border-l-blue-500">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={otherUser?.profile_image_url} />
                <AvatarFallback className="text-xs">
                  {otherUser?.first_name?.[0]}{otherUser?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">
                  {otherUser?.first_name} {otherUser?.last_name}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {booking.race?.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Badge className={cn("text-xs", statusConfig.color)}>
                {statusConfig.text}
              </Badge>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "mb-4 transition-all duration-200",
      timeRemaining?.urgent && "border-l-4 border-l-red-500",
      booking.status === 'pending' && !timeRemaining?.urgent && "border-l-4 border-l-orange-500"
    )}>
      <CardContent className="p-4">
        {/* Header with user info and status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={otherUser?.profile_image_url} />
              <AvatarFallback>
                {otherUser?.first_name?.[0]}{otherUser?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-sm sm:text-base truncate">
                  {otherUser?.first_name} {otherUser?.last_name}
                </h3>
                {otherUser?.verification_status === 'approved' && (
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                )}
              </div>
              
              {otherUser?.average_rating && otherUser.average_rating > 0 && (
                <div className="flex items-center space-x-1 mt-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-xs text-gray-600">{otherUser.average_rating}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge className={cn("text-xs", statusConfig.color)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.text}
            </Badge>
            
            {timeRemaining && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  timeRemaining.urgent ? "text-red-600 border-red-200" : "text-orange-600 border-orange-200"
                )}
              >
                {timeRemaining.text}
              </Badge>
            )}
          </div>
        </div>

        {/* Race and property info */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="font-medium truncate">{booking.race?.name}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{booking.property?.title}</span>
          </div>
        </div>

        {/* Booking details grid */}
        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
          <div>
            <p className="text-gray-600">Check-in</p>
            <p className="font-medium">{formatDate(booking.check_in_date)}</p>
          </div>
          <div>
            <p className="text-gray-600">Check-out</p>
            <p className="font-medium">{formatDate(booking.check_out_date)}</p>
          </div>
          <div>
            <p className="text-gray-600">Huéspedes</p>
            <p className="font-medium">{booking.guests_count}</p>
          </div>
          <div>
            <p className="text-gray-600">Puntos</p>
            <p className="font-medium text-blue-600">{booking.points_cost}</p>
          </div>
        </div>

        {/* Message preview */}
        {booking.request_message && (
          <div className="p-2 bg-gray-50 rounded text-xs mb-3">
            <p className="text-gray-700 line-clamp-2">
              "{booking.request_message}"
            </p>
          </div>
        )}

        {/* Contact info for accepted bookings */}
        {booking.status === 'accepted' && booking.guest_phone && isHost && (
          <div className="flex items-center space-x-2 text-xs text-gray-600 mb-3">
            <Phone className="w-3 h-3" />
            <span>{booking.guest_phone}</span>
          </div>
        )}

        {/* Actions */}
        {availableActions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableActions.slice(0, 2).map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant={action.variant}
                onClick={action.action}
                className="text-xs flex-1 min-w-0"
              >
                {action.label}
              </Button>
            ))}
            
            {availableActions.length > 2 && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="sm" variant="outline" className="px-2">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-auto">
                  <SheetHeader>
                    <SheetTitle>Acciones</SheetTitle>
                  </SheetHeader>
                  <div className="grid gap-2 mt-4">
                    {availableActions.slice(2).map((action, index) => (
                      <Button
                        key={index + 2}
                        variant={action.variant}
                        onClick={action.action}
                        className="w-full justify-start"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileBookingCard;
