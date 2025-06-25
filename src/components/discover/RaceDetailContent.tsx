
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, Target, Star, Mountain, Clock } from "lucide-react";

interface RaceDetailContentProps {
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
    highlights: string;
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
  return (
    <div className="space-y-6">
      {/* Imagen principal */}
      <div className="relative">
        <img 
          src={race.imageUrl} 
          alt={race.name}
          className="w-full h-64 object-cover rounded-lg"
        />
        {race.daysUntil > 0 && (
          <div className="absolute bottom-4 left-4">
            <Badge className="bg-[#1E40AF] text-white">
              <Clock className="w-3 h-3 mr-1" />
              En {race.daysUntil} días
            </Badge>
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
          
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            {formatDate(race.date)}
          </div>

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
