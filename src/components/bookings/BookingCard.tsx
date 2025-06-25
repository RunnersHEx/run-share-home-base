
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, MapPin, Users, Clock, Star, Shield, Phone, MessageSquare } from "lucide-react";
import { Booking } from "@/types/booking";
import { useAuth } from "@/hooks/useAuth";

interface BookingCardProps {
  booking: Booking;
  onRespond?: (bookingId: string, response: 'accepted' | 'rejected') => void;
  onViewDetails?: (booking: Booking) => void;
  onMessage?: (booking: Booking) => void;
  onCancel?: (bookingId: string) => void;
}

const BookingCard = ({ booking, onRespond, onViewDetails, onMessage, onCancel }: BookingCardProps) => {
  const { user } = useAuth();
  const isHost = user?.id === booking.host_id;
  const isGuest = user?.id === booking.guest_id;
  const otherUser = isHost ? booking.guest : booking.host;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Pendiente',
      accepted: 'Aceptada',
      rejected: 'Rechazada',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada'
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getTimeRemaining = () => {
    if (booking.status !== 'pending') return null;
    
    const deadline = new Date(booking.host_response_deadline);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    if (diffHours <= 0) return 'Expirado';
    if (diffHours < 24) return `${diffHours}h restantes`;
    return `${Math.ceil(diffHours / 24)}d restantes`;
  };

  const canCancel = () => {
    return booking.status === 'pending' || booking.status === 'accepted';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={otherUser?.profile_image_url} />
              <AvatarFallback>
                {otherUser?.first_name?.[0]}{otherUser?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">
                  {otherUser?.first_name} {otherUser?.last_name}
                </h3>
                {otherUser?.verification_status === 'approved' && (
                  <Shield className="w-4 h-4 text-green-500" />
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {otherUser?.average_rating && otherUser.average_rating > 0 && (
                  <>
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span>{otherUser.average_rating}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(booking.status)}>
              {getStatusText(booking.status)}
            </Badge>
            {booking.status === 'pending' && isHost && (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                {getTimeRemaining()}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Información de la carrera y propiedad */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{booking.race?.name}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{booking.property?.title} - {booking.property?.locality}</span>
          </div>
        </div>

        {/* Fechas y detalles */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Check-in</p>
            <p className="font-medium">{formatDate(booking.check_in_date)}</p>
          </div>
          <div>
            <p className="text-gray-600">Check-out</p>
            <p className="font-medium">{formatDate(booking.check_out_date)}</p>
          </div>
          <div>
            <p className="text-gray-600">Guests</p>
            <p className="font-medium">{booking.guests_count}</p>
          </div>
          <div>
            <p className="text-gray-600">Puntos</p>
            <p className="font-medium">{booking.points_cost}</p>
          </div>
        </div>

        {/* Mensaje de solicitud (preview) */}
        {booking.request_message && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 line-clamp-2">
              {booking.request_message}
            </p>
          </div>
        )}

        {/* Información de contacto para reservas aceptadas */}
        {booking.status === 'accepted' && booking.guest_phone && isHost && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{booking.guest_phone}</span>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-wrap gap-2 pt-2">
          {booking.status === 'pending' && isHost && onRespond && (
            <>
              <Button
                size="sm"
                onClick={() => onRespond(booking.id, 'accepted')}
                className="bg-green-600 hover:bg-green-700"
              >
                Aceptar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRespond(booking.id, 'rejected')}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Rechazar
              </Button>
            </>
          )}

          {(booking.status === 'accepted' || booking.status === 'confirmed') && onMessage && (
            <Button size="sm" variant="outline" onClick={() => onMessage(booking)}>
              <MessageSquare className="w-4 h-4 mr-1" />
              Mensaje
            </Button>
          )}

          {onViewDetails && (
            <Button size="sm" variant="outline" onClick={() => onViewDetails(booking)}>
              Ver Detalles
            </Button>
          )}

          {canCancel() && onCancel && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCancel(booking.id)}
              className="text-red-600 border-red-200 hover:bg-red-50 ml-auto"
            >
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingCard;
