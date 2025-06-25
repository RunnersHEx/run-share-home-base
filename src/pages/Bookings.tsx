
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Users, 
  Trophy, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  XCircle,
  MessageSquare,
  RefreshCw 
} from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { BookingFilters } from "@/types/booking";
import BookingCard from "@/components/bookings/BookingCard";

const Bookings = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState<BookingFilters>({});
  
  const { bookings, loading, stats, respondToBooking, cancelBooking, refetchBookings } = useBookings(filters);

  useEffect(() => {
    // Actualizar filtros basado en la pestaña activa
    let newFilters: BookingFilters = {};
    
    switch (activeTab) {
      case "pending":
        newFilters = { status: "pending" };
        break;
      case "active":
        newFilters = { status: "accepted" };
        break;
      case "completed":
        newFilters = { status: "completed" };
        break;
      case "as-guest":
        newFilters = { role: "guest" };
        break;
      case "as-host":
        newFilters = { role: "host" };
        break;
      default:
        newFilters = {};
    }
    
    setFilters(newFilters);
  }, [activeTab]);

  const handleRespond = async (bookingId: string, response: 'accepted' | 'rejected') => {
    await respondToBooking(bookingId, response);
  };

  const handleCancel = async (bookingId: string) => {
    const shouldRefund = window.confirm('¿Deseas procesar un reembolso de puntos?');
    await cancelBooking(bookingId, shouldRefund);
  };

  const handleViewDetails = (booking: any) => {
    // TODO: Implementar modal de detalles
    console.log('View details for booking:', booking);
  };

  const handleMessage = (booking: any) => {
    // TODO: Implementar sistema de mensajería
    console.log('Open messages for booking:', booking);
  };

  const getFilteredBookings = () => {
    return bookings;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Reservas</h1>
            <p className="text-gray-600">Gestiona tus solicitudes y reservas de carreras</p>
          </div>
          <Button 
            variant="outline"
            onClick={refetchBookings}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Cargando...' : 'Actualizar'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingRequests}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedBookings}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa Aceptación</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.acceptanceRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs para filtrar reservas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending">
              Pendientes
              {stats.pendingRequests > 0 && (
                <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                  {stats.pendingRequests}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">Activas</TabsTrigger>
            <TabsTrigger value="completed">Completadas</TabsTrigger>
            <TabsTrigger value="as-guest">Como Guest</TabsTrigger>
            <TabsTrigger value="as-host">Como Host</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1E40AF] mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando reservas...</p>
              </div>
            ) : getFilteredBookings().length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No hay reservas
                </h3>
                <p className="text-gray-600 mb-6">
                  {activeTab === 'pending' 
                    ? 'No tienes solicitudes pendientes en este momento'
                    : activeTab === 'as-guest'
                    ? 'No has realizado ninguna reserva como guest'
                    : activeTab === 'as-host'
                    ? 'No has recibido reservas como host'
                    : 'No tienes reservas que mostrar'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {getFilteredBookings().map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onRespond={handleRespond}
                    onViewDetails={handleViewDetails}
                    onMessage={handleMessage}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Información adicional */}
        {stats.pendingRequests > 0 && (
          <Card className="mt-8 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <h4 className="font-semibold text-orange-800">
                    Tienes {stats.pendingRequests} solicitud{stats.pendingRequests > 1 ? 'es' : ''} pendiente{stats.pendingRequests > 1 ? 's' : ''}
                  </h4>
                  <p className="text-sm text-orange-700">
                    Recuerda que tienes 48 horas para responder a cada solicitud.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Bookings;
