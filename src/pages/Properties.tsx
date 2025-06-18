
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { useProperties } from "@/hooks/useProperties";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Home, MapPin, Users, Star, TrendingUp, Eye, EyeOff } from "lucide-react";
import PropertyWizard from "@/components/properties/PropertyWizard";

const Properties = () => {
  const { user, loading: authLoading } = useAuth();
  const { properties, loading, togglePropertyStatus } = useProperties();
  const [showWizard, setShowWizard] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const filteredProperties = properties.filter(property => {
    if (filterStatus === 'active') return property.is_active;
    if (filterStatus === 'inactive') return !property.is_active;
    return true;
  });

  const totalProperties = properties.length;
  const activeProperties = properties.filter(p => p.is_active).length;
  const totalBookings = properties.reduce((sum, p) => sum + p.total_bookings, 0);
  const totalPoints = properties.reduce((sum, p) => sum + p.points_earned, 0);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await togglePropertyStatus(id, !currentStatus);
  };

  if (showWizard) {
    return <PropertyWizard onClose={() => setShowWizard(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Propiedades</h1>
              <p className="text-gray-600 mt-2">Gestiona tus alojamientos y maximiza tus intercambios</p>
            </div>
            <Button 
              onClick={() => setShowWizard(true)}
              className="bg-runner-blue-600 hover:bg-runner-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Nueva Propiedad
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Home className="h-8 w-8 text-runner-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Propiedades</p>
                  <p className="text-2xl font-bold">{totalProperties}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-runner-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Propiedades Activas</p>
                  <p className="text-2xl font-bold">{activeProperties}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-runner-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Intercambios</p>
                  <p className="text-2xl font-bold">{totalBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-runner-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Puntos Ganados</p>
                  <p className="text-2xl font-bold">{totalPoints}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">Todas ({totalProperties})</TabsTrigger>
            <TabsTrigger value="active">Activas ({activeProperties})</TabsTrigger>
            <TabsTrigger value="inactive">Inactivas ({totalProperties - activeProperties})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Properties Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-runner-blue-600"></div>
          </div>
        ) : filteredProperties.length === 0 ? (
          <Card className="p-12 text-center">
            <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {totalProperties === 0 ? "¡Agrega tu primera propiedad!" : "No hay propiedades que mostrar"}
            </h3>
            <p className="text-gray-600 mb-6">
              {totalProperties === 0 
                ? "Comienza a compartir tu espacio con runners de todo el mundo" 
                : "Intenta cambiar los filtros para ver más propiedades"}
            </p>
            {totalProperties === 0 && (
              <Button 
                onClick={() => setShowWizard(true)}
                className="bg-runner-blue-600 hover:bg-runner-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primera Propiedad
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => {
              const mainImage = property.images?.find(img => img.is_main)?.image_url || 
                              property.images?.[0]?.image_url;
              
              return (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-200 relative">
                    {mainImage ? (
                      <img 
                        src={mainImage} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <Badge variant={property.is_active ? "default" : "secondary"}>
                        {property.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold truncate">
                      {property.title}
                    </CardTitle>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      {property.locality}, {property.provinces.join(", ")}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span>{property.bedrooms} hab • {property.beds} camas • {property.bathrooms} baños</span>
                      <span>Max {property.max_guests} huéspedes</span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">
                          {property.average_rating > 0 ? property.average_rating.toFixed(1) : "Sin calificar"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {property.total_bookings} intercambios
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(property.id, property.is_active)}
                        className="flex-1"
                      >
                        {property.is_active ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Activar
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties;
