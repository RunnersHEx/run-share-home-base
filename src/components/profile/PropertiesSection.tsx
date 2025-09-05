
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProperties } from "@/hooks/useProperties";
import PropertyWizard from "@/components/properties/PropertyWizard";
import PropertyEditButton from "@/components/properties/PropertyEditButton";
import { PhotoGalleryModal } from "@/components/common/PhotoGalleryModal";
import { Plus, Home, MapPin, Users, Bed, Bath, Eye, Star, Camera } from "lucide-react";
import UserAccessGuard from "@/components/guards/UserAccessGuard";

const PropertiesSection = () => {
  const { properties, loading, refetchProperties } = useProperties();
  const [showWizard, setShowWizard] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [selectedPropertyPhotos, setSelectedPropertyPhotos] = useState<any[]>([]);
  const [selectedPropertyTitle, setSelectedPropertyTitle] = useState("");

  const handleViewPhotos = (property: any) => {
    if (property.images && property.images.length > 0) {
      setSelectedPropertyPhotos(property.images);
      setSelectedPropertyTitle(property.title);
      setShowPhotoGallery(true);
    }
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    // Refrescar la lista de propiedades después de cerrar el wizard
    refetchProperties();
  };

  if (showWizard) {
    return (
      <PropertyWizard 
        onClose={handleCloseWizard}
      />
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando propiedades...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Home className="h-6 w-6 text-blue-600" />
            Mi Propiedad
          </div>
          <UserAccessGuard showCreateRestriction={true}>
          <Button onClick={() => setShowWizard(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Propiedad
          </Button>
          </UserAccessGuard>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {properties.length === 0 ? (
          <div className="text-center py-12">
            <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No has registrado todavía tu propiedad
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Agrega tu propiedad para comenzar a recibir runners de todo el mundo. 
              Comparte tu hogar y descubre nuevas culturas corriendo.
            </p>
            <Button onClick={() => setShowWizard(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Propiedad
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {properties.map((property) => {
              console.log('Property images:', property.images); // Debug log
              // Find main image first, fallback to first image if no main is set
              const mainImage = property.images?.find(img => img.is_main)?.image_url || 
                              property.images?.[0]?.image_url;
              
              console.log('Main image for property', property.id, ':', mainImage); // Debug log
              
              return (
                <Card key={property.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
                  {/* Image section */}
                  <div className="aspect-video bg-gray-200 relative overflow-hidden rounded-t-lg">
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
                  
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {property.title}
                        </h3>
                        <div className="flex items-center text-gray-600 text-sm mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          {property.locality}
                        </div>
                        {/* Province(s) display */}
                        {property.provinces && property.provinces.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {property.provinces.map((province, index) => (
                              <Badge 
                                key={`${province}-${index}`}
                                className="bg-[#FF6F0F] hover:bg-[#FF6F0F]/90 text-white text-xs px-2 py-1"
                              >
                                {province}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {property.images && property.images.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewPhotos(property)}
                            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                          >
                            <Camera className="w-4 h-4 mr-1" />
                            Ver Fotos ({property.images.length})
                          </Button>
                        )}
                        <PropertyEditButton 
                          property={property}
                          onPropertyUpdated={() => refetchProperties()}
                        />
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {property.description}
                    </p>

                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center text-gray-600 mb-1">
                          <Users className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">{property.max_guests}</span>
                        </div>
                        <span className="text-xs text-gray-500">Huéspedes</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center text-gray-600 mb-1">
                          <Bed className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">{property.bedrooms}</span>
                        </div>
                        <span className="text-xs text-gray-500">Habitaciones</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center text-gray-600 mb-1">
                          <Bed className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">{property.beds}</span>
                        </div>
                        <span className="text-xs text-gray-500">Camas</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center text-gray-600 mb-1">
                          <Bath className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">{property.bathrooms}</span>
                        </div>
                        <span className="text-xs text-gray-500">Baños</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {property.total_bookings} reservas
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                        {property.average_rating?.toFixed(1) || '0.0'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        isOpen={showPhotoGallery}
        onClose={() => setShowPhotoGallery(false)}
        photos={selectedPropertyPhotos}
        title={`Fotos de ${selectedPropertyTitle}`}
      />
    </Card>
  );
};

export default PropertiesSection;
