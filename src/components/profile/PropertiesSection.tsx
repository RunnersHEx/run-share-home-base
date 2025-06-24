
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Plus, MapPin, Users, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PropertiesSection = () => {
  const navigate = useNavigate();

  // Datos de ejemplo - en el futuro se conectará con la base de datos
  const properties = [
    {
      id: 1,
      title: "Casa cerca del Parque del Retiro",
      city: "Madrid",
      country: "España",
      guests: 4,
      bedrooms: 2,
      bathrooms: 1,
      status: "active",
      bookings: 12,
      rating: 4.8,
      image: "/api/placeholder/300/200"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Home className="h-6 w-6 text-blue-600" />
            <span>Mis Propiedades</span>
          </CardTitle>
          <Button 
            onClick={() => navigate("/properties")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Propiedad
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {properties.length === 0 ? (
          <div className="text-center py-12">
            <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes propiedades registradas
            </h3>
            <p className="text-gray-600 mb-6">
              Comparte tu hogar con runners de todo el mundo y gana puntos
            </p>
            <Button 
              onClick={() => navigate("/properties")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primera Propiedad
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((property) => (
              <div key={property.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {property.title}
                    </h3>
                    <div className="flex items-center text-gray-600 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{property.city}, {property.country}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{property.guests} huéspedes</span>
                      </div>
                      <span>•</span>
                      <span>{property.bedrooms} dormitorios</span>
                      <span>•</span>
                      <span>{property.bathrooms} baños</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-3">
                      <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                        {property.status === 'active' ? 'Activa' : 'Inactiva'}
                      </Badge>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">{property.rating}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {property.bookings} reservas
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertiesSection;
