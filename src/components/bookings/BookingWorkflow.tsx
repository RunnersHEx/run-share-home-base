import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  Users,
  Star,
  Bell
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings } from "@/hooks/useBookings";
import { MessagingModal } from "@/components/messaging";
import MobileBookingCard from "./MobileBookingCard";
import HostDashboard from "@/components/host/HostDashboard";
import HostAnalytics from "@/components/host/HostAnalytics";
import { Booking } from "@/types/booking";
import { toast } from "sonner";

interface BookingWorkflowProps {
  defaultTab?: string;
  userRole?: 'guest' | 'host' | 'both';
}

const BookingWorkflow = ({ defaultTab = 'overview', userRole = 'both' }: BookingWorkflowProps) => {
  const { user } = useAuth();
  const { 
    bookings, 
    loading, 
    error, 
    stats, 
    respondToBooking, 
    cancelBooking, 
    confirmBooking, 
    completeBooking,
    getPendingHostRequests,
    getUpcomingBookings,
    getBookingsByStatus
  } = useBookings();
  
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showMessaging, setShowMessaging] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Get different booking categories
  const pendingHostRequests = getPendingHostRequests();
  const upcomingBookings = getUpcomingBookings();
  const pendingGuestRequests = getBookingsByStatus('pending').filter(b => b.guest_id === user?.id);
  const acceptedBookings = getBookingsByStatus('accepted');
  const completedBookings = getBookingsByStatus('completed');

  const handleRespond = async (bookingId: string, response: 'accepted' | 'rejected') => {
    const success = await respondToBooking(bookingId, response);
    if (success) {
      toast.success(`Solicitud ${response === 'accepted' ? 'aceptada' : 'rechazada'} correctamente`);
    }
  };

  const handleCancel = async (bookingId: string, cancelledBy: 'guest' | 'host') => {
    const success = await cancelBooking(bookingId, cancelledBy);
    if (success) {
      toast.success('Reserva cancelada correctamente');
    }
  };

  const handleConfirm = async (bookingId: string) => {
    const success = await confirmBooking(bookingId);
    if (success) {
      toast.success('Reserva confirmada correctamente');
    }
  };

  const handleComplete = async (bookingId: string) => {
    const success = await completeBooking(bookingId);
    if (success) {
      toast.success('Reserva completada correctamente');
    }
  };

  const handleMessage = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowMessaging(true);
  };

  const handleCloseMessaging = () => {
    setShowMessaging(false);
    setSelectedBooking(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error al cargar las reservas</h3>
            <p className="text-gray-600">Por favor, intenta de nuevo más tarde.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Panel de Reservas
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Gestiona todas tus reservas en un solo lugar
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Pendientes</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-600">
                  {pendingHostRequests.length + pendingGuestRequests.length}
                </p>
              </div>
              <Clock className="h-5 w-5 sm:h-8 sm:w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Próximas</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">
                  {upcomingBookings.length}
                </p>
              </div>
              <Calendar className="h-5 w-5 sm:h-8 sm:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Completadas</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  {completedBookings.length}
                </p>
              </div>
              <CheckCircle className="h-5 w-5 sm:h-8 sm:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Puntos</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">
                  {stats.totalPointsEarned}
                </p>
              </div>
              <Star className="h-5 w-5 sm:h-8 sm:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            Resumen
          </TabsTrigger>
          <TabsTrigger value="host" className="text-xs sm:text-sm">
            Host
          </TabsTrigger>
          <TabsTrigger value="guest" className="text-xs sm:text-sm">
            Huésped
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Urgent Actions */}
          {pendingHostRequests.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Solicitudes Urgentes ({pendingHostRequests.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingHostRequests.slice(0, 3).map((booking) => (
                    <MobileBookingCard
                      key={booking.id}
                      booking={booking}
                      onRespond={handleRespond}
                      onMessage={handleMessage}
                      compact
                    />
                  ))}
                  {pendingHostRequests.length > 3 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('host')}
                      className="w-full"
                    >
                      Ver todas las solicitudes ({pendingHostRequests.length})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Bookings */}
          {upcomingBookings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <span>Próximas Reservas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingBookings.slice(0, 3).map((booking) => (
                    <MobileBookingCard
                      key={booking.id}
                      booking={booking}
                      onMessage={handleMessage}
                      onConfirm={handleConfirm}
                      onComplete={handleComplete}
                      onCancel={handleCancel}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rendimiento como Host</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tasa de Aceptación</span>
                  <span className="font-semibold">{stats.acceptanceRate}%</span>
                </div>
                <Progress value={stats.acceptanceRate} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tiempo de Respuesta</span>
                  <span className="font-semibold">{stats.averageResponseTime}h</span>
                </div>
                <Progress value={Math.max(0, 100 - (stats.averageResponseTime / 48) * 100)} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">
                      {stats.totalPointsEarned} puntos ganados este mes
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">
                      {stats.completedBookings} reservas completadas
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">
                      {acceptedBookings.length} reservas activas
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="host" className="space-y-6">
          <HostDashboard onViewBookingDetails={(booking) => handleMessage(booking)} />
        </TabsContent>

        <TabsContent value="guest" className="space-y-6">
          {/* Guest Bookings */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Mis Solicitudes</h2>
            
            {pendingGuestRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <span>Esperando Respuesta ({pendingGuestRequests.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingGuestRequests.map((booking) => (
                      <MobileBookingCard
                        key={booking.id}
                        booking={booking}
                        onCancel={handleCancel}
                        onMessage={handleMessage}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {acceptedBookings.filter(b => b.guest_id === user?.id).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Confirmadas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {acceptedBookings
                      .filter(b => b.guest_id === user?.id)
                      .map((booking) => (
                        <MobileBookingCard
                          key={booking.id}
                          booking={booking}
                          onMessage={handleMessage}
                          onCancel={handleCancel}
                        />
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <HostAnalytics />
        </TabsContent>
      </Tabs>

      {/* Messaging Modal */}
      <MessagingModal
        isOpen={showMessaging}
        onClose={handleCloseMessaging}
        bookingId={selectedBooking?.id}
        currentUserId={user?.id || ''}
        title={`Chat con ${selectedBooking ? (
          user?.id === selectedBooking.host_id 
            ? `${selectedBooking.guest?.first_name} ${selectedBooking.guest?.last_name}`
            : `${selectedBooking.host?.first_name} ${selectedBooking.host?.last_name}`
        ) : 'Usuario'}`}
      />
    </div>
  );
};

export default BookingWorkflow;
