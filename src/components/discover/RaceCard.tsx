
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPin, Calendar, Star, Clock, Trophy, Heart, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { ReviewsService } from "@/services/reviews/properReviewsService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Move utility functions outside component to prevent re-creation on each render
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getModalityBadgeColor = (modality: string) => {
  return modality === 'road' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
};

const getDistanceBadgeColor = (distance: string) => {
  const colors = {
    'ultra': 'bg-red-100 text-red-800',
    'marathon': 'bg-orange-100 text-orange-800',
    'half_marathon': 'bg-yellow-100 text-yellow-800',
    '20k': 'bg-green-100 text-green-800',
    '15k': 'bg-blue-100 text-blue-800',
    '10k': 'bg-indigo-100 text-indigo-800',
    '5k': 'bg-purple-100 text-purple-800'
  };
  return colors[distance as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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

interface RaceCardProps {
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
    host: {
      id: string;
      name: string;
      rating: number;
      verified: boolean;
      imageUrl: string;
    };
    pointsCost: number;
    available: boolean;
    highlights: string;
  };
  isSaved: boolean;
  onSave: () => void;
  onViewDetails: () => void;
  onAuthModal?: (mode: "login" | "register") => void;
}

export const RaceCard = ({ race, isSaved, onSave, onViewDetails, onAuthModal }: RaceCardProps) => {
  const { user } = useAuth();
  const [dynamicRating, setDynamicRating] = useState(race.host.rating);
  const [reviewCount, setReviewCount] = useState(0);
  const [loadingRating, setLoadingRating] = useState(true);

  useEffect(() => {
    fetchHostRating();
  }, [race.host.id]);

  const fetchHostRating = async () => {
    try {
      const stats = await ReviewsService.getRatingStatsForHost(race.host.id);
      setDynamicRating(stats.averageRating);
      setReviewCount(stats.totalReviews);
    } catch (error) {
      console.error('Error fetching host rating for race card:', error);
      // Keep the original rating as fallback
      setDynamicRating(race.host.rating);
      setReviewCount(0);
    } finally {
      setLoadingRating(false);
    }
  };

  const handleViewDetailsClick = () => {
    if (!user) {
      toast.error("Para continuar explorando esta experiencia, necesitas registrarte.");
      if (onAuthModal) {
        onAuthModal("register");
      }
      return;
    }
    onViewDetails();
  };
  return (
    <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="relative">
        <img 
          src={race.imageUrl} 
          alt={race.name}
          className="w-full h-48 object-cover"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
          onClick={onSave}
        >
          <Heart 
            className={`w-4 h-4 ${
              isSaved 
                ? 'fill-red-500 text-red-500' 
                : 'text-gray-600'
            }`} 
          />
        </Button>
        
        {/* Countdown Badge */}
        {race.daysUntil > 0 && (
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-[#1E40AF] text-white">
              <Clock className="w-3 h-3 mr-1" />
              En {race.daysUntil} días
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2">{race.name}</h3>
          
          {race.province && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="tracking-wide">Provincia: <span className="font-medium tracking-normal">{race.province}</span></span>
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(race.date)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Race Characteristics */}
        <div className="space-y-3">
          {/* Modalities */}
          <div className="flex flex-wrap gap-1">
            {race.modalities.map((modality) => (
              <Badge key={modality} className={getModalityBadgeColor(modality)}>
                {modality === 'road' ? 'Ruta/Asfalto' : 'Trail/Montaña'}
              </Badge>
            ))}
          </div>
          
          {/* Distances with proper colors */}
          <div className="flex flex-wrap gap-1">
            {race.distances.slice(0, 2).map((distance) => (
              <Badge key={distance} className={getDistanceBadgeColor(distance)}>
                {getDistanceLabel(distance)}
              </Badge>
            ))}
            {race.distances.length > 2 && (
              <Badge className="bg-gray-100 text-gray-800">
                +{race.distances.length - 2} más
              </Badge>
            )}
          </div>

          {/* Highlights - Special phrase */}
          <p className="text-sm text-gray-600 line-clamp-2 italic">
            "{race.highlights}"
          </p>

          {/* Host Info */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-2">
              <img 
                src={race.host.imageUrl} 
                alt={race.host.name}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span className="text-sm font-medium">{race.host.name}</span>
                  {race.host.verified && (
                    <CheckCircle className="w-3 h-3 ml-1 text-green-600" />
                  )}
                </div>
                <div className="flex items-center">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-xs ml-1 text-gray-500">
                    {loadingRating ? (
                      <span className="animate-pulse">...</span>
                    ) : reviewCount > 0 ? (
                      `${dynamicRating.toFixed(1)} (${reviewCount})`
                    ) : (
                      'Sin reseñas'
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Points Cost and Availability Status */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center">
              <Trophy className="w-4 h-4 text-[#EA580C] mr-1" />
              <span className="text-lg font-bold text-[#EA580C]">
                {race.pointsCost} puntos
              </span>
            </div>
            
            <div className="flex flex-col items-end space-y-1">
              <div className={`text-sm font-medium px-2 py-1 rounded ${
                race.available 
                  ? 'text-green-700 bg-green-100' 
                  : 'text-red-700 bg-red-100'
              }`}>
                {race.available ? 'Disponible' : 'No Disponible'}
              </div>
              
              <Button 
                className="bg-[#1E40AF] hover:bg-[#1E40AF]/90"
                size="sm"
                onClick={handleViewDetailsClick}
              >
                Ver Detalles
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
