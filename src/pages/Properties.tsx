
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useProperties } from "@/hooks/useProperties";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Home, MapPin, Users, Star, Bed, Bath } from "lucide-react";
import { useState } from "react";
import PropertyWizard from "@/components/properties/PropertyWizard";

const Properties = () => {
  const { properties, loading, error } = useProperties();
  const [showWizard, setShowWizard] = useState(false);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Propiedades</h1>
            <p className="text-gray-600">Gestiona tus alojamientos para runners</p>
          </div>
          <Button onClick={() => setShowWizard(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Agregar Propiedad</span>
          </Button>
        </div>

        {error && (
          <Card className="mb-6">
            <CardContent className="p-6 text-center text-red-600">
              Error al cargar las propiedades. Por favor, intenta de nuevo.
            </CardContent>
          </Card>
        )}

        {!properties || properties.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tienes propiedades aún</h3>
              <p className="text-gray-600 mb-6">
                Comienza agregando tu primera propiedad para recibir runners de todo el mundo
              </p>
              <Button onClick={() => setShowWizard(true)} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Agregar Mi Primera Propiedad</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-200 relative">
                  {/* Aquí irían las imágenes de la propiedad */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Home className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{property.title}</CardTitle>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    {property.locality}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {property.max_guests} huéspedes
                      </span>
                      <span className="flex items-center">
                        <Bed className="h-4 w-4 mr-1" />
                        {property.bedrooms} habitaciones
                      </span>
                      <span className="flex items-center">
                        <Bed className="h-4 w-4 mr-1" />
                        {property.beds} camas
                      </span>
                      <span className="flex items-center">
                        <Bath className="h-4 w-4 mr-1" />
                        {property.bathrooms} baños
                      </span>
                    </div>
                    {property.average_rating && (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm font-medium">{property.average_rating}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {property.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {property.total_bookings} reservas
                    </span>
                    <Button variant="outline" size="sm">
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showWizard && (
          <PropertyWizard
            onClose={() => setShowWizard(false)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

export default Properties;
