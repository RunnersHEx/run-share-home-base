
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useBookings } from "@/hooks/useBookings";
import BookingCard from "@/components/bookings/BookingCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";

const Bookings = () => {
  const { bookings, loading, error } = useBookings();

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error al cargar las reservas</h3>
              <p className="text-gray-600">Por favor, intenta de nuevo más tarde.</p>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  const pendingBookings = bookings?.filter(b => b.status === 'pending') || [];
  const acceptedBookings = bookings?.filter(b => b.status === 'accepted') || [];
  const completedBookings = bookings?.filter(b => b.status === 'completed') || [];
  const rejectedBookings = bookings?.filter(b => ['rejected', 'cancelled'].includes(b.status)) || [];

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Reservas</h1>
          <p className="text-gray-600">Gestiona todas tus solicitudes de reserva aquí</p>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Pendientes ({pendingBookings.length})</span>
            </TabsTrigger>
            <TabsTrigger value="accepted" className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Aceptadas ({acceptedBookings.length})</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Completadas ({completedBookings.length})</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center space-x-2">
              <XCircle className="h-4 w-4" />
              <span>Rechazadas ({rejectedBookings.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingBookings.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay reservas pendientes</h3>
                  <p className="text-gray-600">Cuando hagas una nueva solicitud aparecerá aquí.</p>
                </CardContent>
              </Card>
            ) : (
              pendingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>

          <TabsContent value="accepted" className="space-y-4">
            {acceptedBookings.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay reservas aceptadas</h3>
                  <p className="text-gray-600">Las reservas aceptadas aparecerán aquí.</p>
                </CardContent>
              </Card>
            ) : (
              acceptedBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedBookings.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay reservas completadas</h3>
                  <p className="text-gray-600">Las reservas completadas aparecerán aquí.</p>
                </CardContent>
              </Card>
            ) : (
              completedBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedBookings.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay reservas rechazadas</h3>
                  <p className="text-gray-600">Las reservas rechazadas aparecerán aquí.</p>
                </CardContent>
              </Card>
            ) : (
              rejectedBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
};

export default Bookings;
