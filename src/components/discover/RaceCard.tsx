
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPin, Calendar, Star, Clock, Trophy, Heart } from "lucide-react";

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

interface RaceCardProps {
  race: {
    id: string;
    name: string;
    location: string;
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
}

export const RaceCard = ({ race, isSaved, onSave, onViewDetails }: RaceCardProps) => {
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
        <div className="absolute bottom-2 left-2">
          <Badge className="bg-[#1E40AF] text-white">
            <Clock className="w-3 h-3 mr-1" />
            En {race.daysUntil} días
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2">{race.name}</h3>
          
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-1" />
            {race.location}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(race.date)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Race Characteristics */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {race.modalities.map((modality) => (
              <Badge key={modality} className={getModalityBadgeColor(modality)}>
                {modality === 'road' ? 'Ruta/Asfalto' : 'Trail/Montaña'}
              </Badge>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-1">
            {race.distances.slice(0, 2).map((distance) => (
              <Badge key={distance} className={getDistanceBadgeColor(distance)}>
                {distance.replace('_', ' ').toUpperCase()}
              </Badge>
            ))}
            {race.distances.length > 2 && (
              <Badge className="bg-gray-100 text-gray-800">
                +{race.distances.length - 2} más
              </Badge>
            )}
          </div>

          {/* Highlights */}
          <p className="text-sm text-gray-600 line-clamp-2">{race.highlights}</p>

          {/* Host Info */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-2">
              <img 
                src={race.host.imageUrl} 
                alt={race.host.name}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm font-medium">{race.host.name}</span>
              {race.host.verified && (
                <Badge variant="secondary" className="text-xs">
                  ✓ Verificado
                </Badge>
              )}
            </div>
            
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm ml-1">{race.host.rating}</span>
            </div>
          </div>

          {/* Points Cost */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center">
              <Trophy className="w-4 h-4 text-[#EA580C] mr-1" />
              <span className="text-lg font-bold text-[#EA580C]">
                {race.pointsCost} puntos
              </span>
            </div>
            
            <Button 
              className="bg-[#1E40AF] hover:bg-[#1E40AF]/90"
              size="sm"
              onClick={onViewDetails}
            >
              Ver Detalles
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
