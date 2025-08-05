
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Target, Star, Mountain, Clock, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

interface RaceDetailContentProps {
  race: {
    id: string;
    name: string;
    location: string;
    province?: string; // Add province field
    date: string;
    daysUntil: number;
    modalities: string[];
    distances: string[];
    terrainProfile: string[];
    imageUrl: string;
    images?: {
      id: string;
      image_url: string;
      caption?: string;
      category: string;
      display_order: number;
    }[];
    highlights: string;
    official_website?: string;
  };
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getModalityLabel = (modality: string) => {
  return modality === 'road' ? 'Ruta/Asfalto' : 'Trail/Montaña';
};

const getDistanceLabel = (distance: string) => {
  const labels = {
    'ultra': 'ULTRA',
    'marathon': 'MARATÓN', 
    'half_marathon': 'MEDIA MARATÓN',
    '20k': '20K',
    '15k': '15K',
    '10k': '10K',
    '5k': '5K'
  };
  return labels[distance as keyof typeof labels] || distance.toUpperCase();
};

export const RaceDetailContent = ({ race }: RaceDetailContentProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasImages = race.images && race.images.length > 0;
  
  // Organize images: cover image first, then others sorted by display_order
  let displayImages: any[] = [];
  if (hasImages) {
    const coverImage = race.images.find(img => img.category === 'cover');
    const otherImages = race.images.filter(img => img.category !== 'cover').sort((a, b) => a.display_order - b.display_order);
    displayImages = coverImage ? [coverImage, ...otherImages] : otherImages;
  } else {
    displayImages = [{ id: 'main', image_url: race.imageUrl, caption: '', category: 'main', display_order: 0 }];
  }

  // Reset image index when race changes
  useEffect(() => {
    setCurrentImageIndex(0);
    console.log('🏁 RaceDetailContent: Reset image index for race:', race.name, 'with', displayImages.length, 'images');
  }, [race.id]);

  const nextImage = () => {
    if (displayImages.length === 0 || currentImageIndex >= displayImages.length - 1) return;
    const newIndex = currentImageIndex + 1;
    setCurrentImageIndex(newIndex);
    console.log('➡️ RaceDetailContent: Next from', currentImageIndex + 1, 'to', newIndex + 1, 'of', displayImages.length);
  };

  const prevImage = () => {
    if (displayImages.length === 0 || currentImageIndex <= 0) return;
    const newIndex = currentImageIndex - 1;
    setCurrentImageIndex(newIndex);
    console.log('⬅️ RaceDetailContent: Previous from', currentImageIndex + 1, 'to', newIndex + 1, 'of', displayImages.length);
  };

  const goToImage = (index: number) => {
    if (index >= 0 && index < displayImages.length) {
      setCurrentImageIndex(index);
      console.log('📏 RaceDetailContent: Jump to image', index + 1, 'of', displayImages.length);
    }
  };

  // Check if navigation arrows should be disabled
  const isPrevDisabled = currentImageIndex <= 0;
  const isNextDisabled = currentImageIndex >= displayImages.length - 1;

  return (
    <div className="space-y-6">
      {/* Image Gallery */}
      <div className="relative">
        <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
          <img 
            src={displayImages[currentImageIndex]?.image_url || race.imageUrl} 
            alt={displayImages[currentImageIndex]?.caption || race.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          
          {/* Navigation Arrows - only show if there are multiple images */}
          {displayImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className={`absolute left-2 top-1/2 transform -translate-y-1/2 text-white ${
                  isPrevDisabled 
                    ? 'bg-black/20 cursor-not-allowed opacity-50' 
                    : 'bg-black/50 hover:bg-black/70'
                }`}
                onClick={prevImage}
                disabled={isPrevDisabled}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-white ${
                  isNextDisabled 
                    ? 'bg-black/20 cursor-not-allowed opacity-50' 
                    : 'bg-black/50 hover:bg-black/70'
                }`}
                onClick={nextImage}
                disabled={isNextDisabled}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}
          
          {/* Image Counter */}
          {displayImages.length > 1 && (
            <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {currentImageIndex + 1}/{displayImages.length}
            </div>
          )}
          
          {/* Days Until Badge */}
          {race.daysUntil > 0 && (
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-[#1E40AF] text-white">
                <Clock className="w-3 h-3 mr-1" />
                En {race.daysUntil} días
              </Badge>
            </div>
          )}
        </div>
        
        {/* Image Caption */}
        {displayImages[currentImageIndex]?.caption && (
          <div className="mt-2 px-3 py-2 bg-gray-50 rounded text-sm text-gray-700">
            {displayImages[currentImageIndex].caption}
          </div>
        )}
        
        {/* Thumbnail Navigation - only show if there are multiple images */}
        {displayImages.length > 1 && (
          <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
            {displayImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => goToImage(index)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentImageIndex 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={image.image_url}
                  alt={image.caption || `Imagen ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detalles básicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#1E40AF]" />
            Información de la Carrera
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            {race.location}
          </div>
          
          {race.province && (
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              Provincia: {race.province}
            </div>
          )}
          
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            {formatDate(race.date)}
          </div>

          {/* Website Link */}
          {race.official_website && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  let url = race.official_website;
                  // Ensure the URL has a protocol for external links
                  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                  }
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Sitio Web Oficial
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-semibold">Modalidades:</h4>
            <div className="flex flex-wrap gap-2">
              {race.modalities.map((modality) => (
                <Badge key={modality} className="bg-blue-100 text-blue-800">
                  {getModalityLabel(modality)}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Distancias disponibles:</h4>
            <div className="flex flex-wrap gap-2">
              {race.distances.map((distance) => (
                <Badge key={distance} className="bg-green-100 text-green-800">
                  {getDistanceLabel(distance)}
                </Badge>
              ))}
            </div>
          </div>

          {race.terrainProfile.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Perfil del terreno:</h4>
              <div className="flex flex-wrap gap-2">
                {race.terrainProfile.map((terrain) => (
                  <Badge key={terrain} className="bg-amber-100 text-amber-800">
                    <Mountain className="w-3 h-3 mr-1" />
                    {terrain === 'hilly' ? 'Con desnivel' : 'Llano'}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-[#EA580C]" />
            Lo que hace especial esta carrera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 italic">"{race.highlights}"</p>
        </CardContent>
      </Card>
    </div>
  );
};
