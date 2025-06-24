
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { useProperties } from "@/hooks/useProperties";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Home, MapPin, Users, Star, TrendingUp, Calendar } from "lucide-react";
import PropertyWizard from "@/components/properties/PropertyWizard";
import PropertyEditButton from "@/components/properties/PropertyEditButton";
import AvailabilityCalendar from "@/components/availability/AvailabilityCalendar";

const Properties = () => {
  const { user, loading: authLoading } = useAuth();
  const { properties, loading, refetchProperties } = useProperties();
  const [showWizard, setShowWizard] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const totalProperties = properties.length;
  const totalBookings = properties.reduce((sum, p) => sum + p.total_bookings, 0);
  const totalPoints = properties.reduce((sum, p) => sum + p.points_earned, 0);

  const handleManageAvailability = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    // Refrescar la lista de propiedades después de cerrar el wizard
    refetchProperties();
  };

  if (showWizard) {
    return <PropertyWizard onClose={handleCloseWizard} />;
  }

  if (selectedPropertyId) {
    const selectedProperty = properties.find(p => p.id === selectedPropertyId);
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => setSelectedPropertyId(null)}
              >
                ← Volver a Mi Propiedad
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Calendario de Disponibilidad
                </h1>
                <p className="text-gray-600 mt-2">
                  {selectedProperty?.title}
                </p>
              </div>
            </div>
          </div>
          
          <AvailabilityCalendar 
            propertyId={selectedPropertyId} 
            isOwner={true}
            className="max-w-4xl"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mi Propiedad</h1>
              <p className="text-gray-600 mt-2">Gestiona tu alojamiento y maximiza tus hospedajes</p>
            </div>
            {totalProperties === 0 && (
              <Button 
                onClick={() => setShowWizard(true)}
                className="bg-runner-blue-600 hover:bg-runner-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Propiedad
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-runner-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Hospedajes</p>
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

        {/* Properties Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-runner-blue-600"></div>
          </div>
        ) : properties.length === 0 ? (
          <Card className="p-12 text-center">
            <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No has registrado todavía tu propiedad
            </h3>
            <p className="text-gray-600 mb-6">
              Agrega tu propiedad para comenzar a compartir tu espacio con runners de todo el mundo
            </p>
            <Button 
              onClick={() => setShowWizard(true)}
              className="bg-runner-blue-600 hover:bg-runner-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Propiedad
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              console.log('Property images:', property.images); // Debug log
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
                        onError={(e) => {
                          console.log('Image failed to load:', mainImage);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
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
                        {property.total_bookings} hospedajes
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <PropertyEditButton 
                        property={property} 
                        onPropertyUpdated={refetchProperties}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleManageAvailability(property.id)}
                        className="flex-1"
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Calendario
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
