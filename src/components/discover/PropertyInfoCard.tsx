import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { 
  Home, 
  Bed, 
  Bath, 
  Users, 
  MapPin,
  Wifi, 
  Car, 
  Utensils, 
  Waves, 
  Wind, 
  Coffee,
  Shirt,
  Trees,
  ShoppingCart,
  Activity,
  Shield,
  Camera,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface PropertyInfoCardProps {
  property: {
    id: string;
    title: string;
    description: string | null;
    locality: string;
    provinces: string[];
    full_address: string;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    max_guests: number;
    amenities: string[];
    house_rules: string | null;
    runner_instructions?: string | null;
    images?: {
      id: string;
      image_url: string;
      caption: string | null;
      is_main: boolean;
      display_order: number;
    }[];
  };
}

const AMENITY_ICONS: { [key: string]: { icon: typeof Wifi; label: string } } = {
  wifi: { icon: Wifi, label: "WiFi" },
  parking: { icon: Car, label: "Estacionamiento" },
  kitchen: { icon: Utensils, label: "Cocina completa" },
  pool: { icon: Waves, label: "Piscina" },
  air_conditioning: { icon: Wind, label: "Aire acondicionado/calefacción" },
  coffee_machine: { icon: Coffee, label: "Cafetera" },
  washing_machine: { icon: Shirt, label: "Lavadora" },
  public_transport: { icon: MapPin, label: "Cerca de transporte público" },
  running_area: { icon: Trees, label: "Zona segura para correr" },
  supermarket: { icon: ShoppingCart, label: "Cerca de supermercado" },
  stretching_mat: { icon: Activity, label: "Colchoneta para estirar" },
  massage_gun: { icon: Activity, label: "Pistola para auto-masaje" },
  foam_roller: { icon: Activity, label: "Roller foam" },
  resistance_band: { icon: Activity, label: "Goma larga para estiramientos" },
  mini_bands: { icon: Activity, label: "Minibands para fortalecimiento" },
  golf_ball: { icon: Activity, label: "Pelota de golf para fascia plantar" }
};

export const PropertyInfoCard = ({ property }: PropertyInfoCardProps) => {
  const [showPhotos, setShowPhotos] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const sortedImages = property.images
    ?.sort((a, b) => {
      if (a.is_main && !b.is_main) return -1;
      if (!a.is_main && b.is_main) return 1;
      return a.display_order - b.display_order;
    }) || [];

  const mainImage = sortedImages.find(img => img.is_main) || sortedImages[0];

  const generalAmenities = property.amenities.filter(amenity => 
    !['stretching_mat', 'massage_gun', 'foam_roller', 'resistance_band', 'mini_bands', 'golf_ball'].includes(amenity)
  );

  const runnerFacilities = property.amenities.filter(amenity => 
    ['stretching_mat', 'massage_gun', 'foam_roller', 'resistance_band', 'mini_bands', 'golf_ball'].includes(amenity)
  );

  // Helper function to truncate description
  const truncateDescription = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Reset photo index when modal opens
  useEffect(() => {
    if (showPhotos) {
      setCurrentPhotoIndex(0);
    }
  }, [showPhotos]);

  const nextPhoto = () => {
    if (sortedImages.length === 0) return;
    setCurrentPhotoIndex((prev) => {
      const newIndex = (prev + 1) % sortedImages.length;
      console.log('Next photo - current:', prev, 'new:', newIndex, 'total:', sortedImages.length);
      return newIndex;
    });
  };

  const prevPhoto = () => {
    if (sortedImages.length === 0) return;
    setCurrentPhotoIndex((prev) => {
      const newIndex = (prev - 1 + sortedImages.length) % sortedImages.length;
      console.log('Previous photo - current:', prev, 'new:', newIndex, 'total:', sortedImages.length);
      return newIndex;
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5 text-[#1E40AF]" />
            Alojamiento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Property Main Image */}
          {mainImage && (
            <div className="relative">
              <img 
                src={mainImage.image_url} 
                alt={property.title}
                className="w-full h-48 object-cover rounded-lg"
              />
              {sortedImages.length > 1 && (
                <Button
                  onClick={() => setShowPhotos(true)}
                  className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                  size="sm"
                >
                  <Camera className="w-4 h-4 mr-1" />
                  Ver Fotos ({sortedImages.length})
                </Button>
              )}
            </div>
          )}

          {/* Property Title */}
          <div>
            <h3 className="font-semibold text-lg">{property.title}</h3>
            <p className="text-sm text-gray-600 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {property.locality}, {property.provinces.join(', ')}
            </p>
          </div>

          {/* Property Description */}
          {property.description && (
            <div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {property.description.length > 150 ? (
                  <>
                    {truncateDescription(property.description)}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-blue-600 underline ml-1"
                      onClick={() => setShowDescription(true)}
                    >
                      Leer más
                    </Button>
                  </>
                ) : (
                  property.description
                )}
              </p>
            </div>
          )}

          {/* Property Specs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center text-sm text-gray-600">
              <Bed className="w-4 h-4 mr-2" />
              {property.bedrooms} dormitorios
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Bed className="w-4 h-4 mr-2" />
              {property.beds} camas
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Bath className="w-4 h-4 mr-2" />
              {property.bathrooms} baños
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-2" />
              Hasta {property.max_guests} huéspedes
            </div>
          </div>

          {/* Running Areas Description */}
          {property.runner_instructions && (
            <div>
              <h4 className="font-medium text-sm mb-2">Zonas para correr cerca</h4>
              <p className="text-sm text-gray-700">{property.runner_instructions}</p>
            </div>
          )}

          {/* General Amenities */}
          {generalAmenities.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Comodidades</h4>
              <div className="flex flex-wrap gap-2">
                {generalAmenities.map((amenity) => {
                  const amenityInfo = AMENITY_ICONS[amenity];
                  if (!amenityInfo) return null;
                  const IconComponent = amenityInfo.icon;
                  return (
                    <Badge key={amenity} variant="secondary" className="text-xs">
                      <IconComponent className="w-3 h-3 mr-1" />
                      {amenityInfo.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Runner Facilities */}
          {runnerFacilities.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Facilidades para el corredor</h4>
              <div className="flex flex-wrap gap-2">
                {runnerFacilities.map((facility) => {
                  const facilityInfo = AMENITY_ICONS[facility];
                  if (!facilityInfo) return null;
                  const IconComponent = facilityInfo.icon;
                  return (
                    <Badge key={facility} variant="outline" className="text-xs border-green-500 text-green-700">
                      <IconComponent className="w-3 h-3 mr-1" />
                      {facilityInfo.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* House Rules */}
          {property.house_rules && (
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                Reglas de la casa
              </h4>
              <div className="text-sm text-gray-700">
                {property.house_rules.split('\n').map((rule, index) => (
                  <div key={index} className="mb-1">• {rule}</div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos Modal */}
      <Dialog open={showPhotos} onOpenChange={setShowPhotos}>
        <DialogContent 
          className="max-w-4xl"
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              prevPhoto();
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              nextPhoto();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Fotos del alojamiento</DialogTitle>
          </DialogHeader>
          {sortedImages.length > 0 && (
            <div className="relative">
              {(() => {
                console.log('🔄 RENDER: currentPhotoIndex:', currentPhotoIndex, 'sortedImages.length:', sortedImages.length);
                return null;
              })()}
              <img 
                key={`photo-${currentPhotoIndex}-${sortedImages[currentPhotoIndex]?.id}`}
                src={sortedImages[currentPhotoIndex]?.image_url}
                alt={sortedImages[currentPhotoIndex]?.caption || property.title}
                className="w-full max-h-[80vh] object-contain rounded-lg"
                onError={(e) => {
                  console.error('Image failed to load:', sortedImages[currentPhotoIndex]?.image_url);
                }}
              />
              
              {sortedImages.length > 1 && (
                <>
                  <Button
                    onClick={prevPhoto}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    size="icon"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={nextPhoto}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    size="icon"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  
                  <div 
                    key={`counter-${currentPhotoIndex}`}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/75 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg border border-white/20"
                    style={{ zIndex: 10 }}
                  >
                    {currentPhotoIndex + 1} / {sortedImages.length}
                  </div>
                </>
              )}
              
              {sortedImages[currentPhotoIndex]?.caption && (
                <div className="mt-2 text-sm text-gray-600 text-center">
                  {sortedImages[currentPhotoIndex].caption}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Description Modal */}
      <Dialog open={showDescription} onOpenChange={setShowDescription}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Descripción del alojamiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{property.title}</h3>
            <p className="text-sm text-gray-600 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {property.locality}, {property.provinces.join(', ')}
            </p>
            {property.description && (
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {property.description}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
