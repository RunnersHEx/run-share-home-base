
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Users, Trophy, Star } from "lucide-react";

interface FeaturedRacesSectionProps {
  onAuthModal: (mode: "login" | "register") => void;
}

const FeaturedRacesSection = ({ onAuthModal }: FeaturedRacesSectionProps) => {
  const handleViewAllRaces = () => {
    console.log('FeaturedRacesSection: View all races button clicked');
    // Navegar directamente a la página de descubrimiento
    window.location.href = '/discover';
  };

  const featuredRaces = [
    {
      id: 1,
      name: "Maraton de Madrid",
      location: "Madrid, España",
      date: "2024-04-28",
      participants: 40000,
      image: "/lovable-uploads/a989eba0-bb19-4efd-bcfc-3c1f8870d2cb.png",
      hostRating: 4.9,
      pointsCost: 100,
      availableSpots: 3
    },
    {
      id: 2,
      name: "Rock 'n' Roll Barcelona",
      location: "Barcelona, España", 
      date: "2024-03-17",
      participants: 15000,
      image: "/lovable-uploads/1918d362-5172-4a88-afac-e81d1926b766.png",
      hostRating: 4.8,
      pointsCost: 80,
      availableSpots: 2
    },
    {
      id: 3,
      name: "Valencia Marathon",
      location: "Valencia, España",
      date: "2024-12-01", 
      participants: 25000,
      image: "/lovable-uploads/2e278f92-53fa-4ccf-b631-a95da538218b.png",
      hostRating: 4.9,
      pointsCost: 120,
      availableSpots: 1
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Carreras Destacadas
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Descubre las carreras más populares en nuestra comunidad. Conecta con hosts locales 
            que conocen cada detalle de la carrera y la ciudad.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredRaces.map((race) => (
            <div key={race.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="relative h-48">
                <img 
                  src={race.image} 
                  alt={race.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 text-sm font-semibold text-runner-blue-600">
                  {race.pointsCost} puntos
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{race.name}</h3>
                
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="text-sm">{race.location}</span>
                </div>
                
                <div className="flex items-center text-gray-600 mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="text-sm">{new Date(race.date).toLocaleDateString('es-ES')}</span>
                </div>
                
                <div className="flex items-center text-gray-600 mb-2">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="text-sm">{race.participants.toLocaleString()} participantes</span>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span className="text-sm font-medium">{race.hostRating}</span>
                  </div>
                  <div className="text-sm text-runner-green-600 font-medium">
                    {race.availableSpots} plazas disponibles
                  </div>
                </div>
                
                <Button className="w-full mt-4 bg-runner-blue-600 hover:bg-runner-blue-700">
                  Ver Detalles
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button 
            onClick={handleViewAllRaces}
            className="bg-runner-blue-600 hover:bg-runner-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg"
          >
            Ver Todas las Carreras
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedRacesSection;
