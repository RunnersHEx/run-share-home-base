
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Calendar, 
  Star, 
  Clock, 
  Trophy, 
  Users, 
  Globe,
  Phone,
  CheckCircle,
  Mountain,
  Route,
  Target
} from "lucide-react";
import BookingRequestModal from "@/components/bookings/BookingRequestModal";

interface RaceDetailModalProps {
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
    maxGuests?: number;
  };
  isOpen: boolean;
  onClose: () => void;
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

export const RaceDetailModal = ({ race, isOpen, onClose }: RaceDetailModalProps) => {
  const [showBookingModal, setShowBookingModal] = useState(false);

  const handleBookingRequest = () => {
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (bookingData: any) => {
    // This will be handled by the BookingRequestModal
    console.log('Booking request submitted:', bookingData);
    setShowBookingModal(false);
  };

  // Transform our race data to match the expected Race type
  const raceForBooking = {
    id: race.id,
    name: race.name,
    race_date: race.date,
    points_cost: race.pointsCost,
    host_id: race.host.id,
    max_guests: race.maxGuests || 1,
    start_location: race.location,
    highlights: race.highlights,
    modalities: race.modalities,
    distances: race.distances,
    terrain_profile: race.terrainProfile
  };

  // Mock property data - in a real app, this would come from the API
  const propertyForBooking = {
    id: `property_${race.host.id}`,
    title: `Alojamiento en ${race.location}`,
    locality: race.location,
    max_guests: race.maxGuests || 1,
    host_id: race.host.id
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{race.name}</DialogTitle>
          </DialogHeader>

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

            <div className="grid md:grid-cols-3 gap-6">
              {/* Información principal */}
              <div className="md:col-span-2 space-y-6">
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

              {/* Sidebar - Host y reserva */}
              <div className="space-y-6">
                {/* Información del host */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tu Host Runner</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={race.host.imageUrl} 
                        alt={race.host.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-medium">{race.host.name}</span>
                          {race.host.verified && (
                            <CheckCircle className="w-4 h-4 ml-1 text-green-600" />
                          )}
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm ml-1 text-gray-500">{race.host.rating} ⭐</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Información de reserva */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Reservar Experiencia</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Costo:</span>
                      <div className="flex items-center">
                        <Trophy className="w-4 h-4 text-[#EA580C] mr-1" />
                        <span className="text-lg font-bold text-[#EA580C]">
                          {race.pointsCost} puntos
                        </span>
                      </div>
                    </div>
                    
                    {race.maxGuests && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Máx. huéspedes:</span>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-gray-500 mr-1" />
                          <span>{race.maxGuests}</span>
                        </div>
                      </div>
                    )}

                    <Separator />

                    <Button 
                      onClick={handleBookingRequest}
                      className="w-full bg-[#1E40AF] hover:bg-[#1E40AF]/90"
                      disabled={!race.available}
                    >
                      {race.available ? 'Solicitar Reserva' : 'No Disponible'}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      No se cobrará hasta que el host acepte tu solicitud
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de solicitud de reserva */}
      {showBookingModal && (
        <BookingRequestModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onSubmit={handleBookingSubmit}
          race={raceForBooking}
          property={propertyForBooking}
        />
      )}
    </>
  );
};
