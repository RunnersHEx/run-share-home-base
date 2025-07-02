
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users, Star } from "lucide-react";
import { useDiscoverRaces } from "@/hooks/useDiscoverRaces";

const FeaturedRacesSection = () => {
  const navigate = useNavigate();
  const { races, loading } = useDiscoverRaces();

  const handleViewAllRaces = () => {
    navigate('/discover');
  };

  const handleViewRaceDetails = (raceId: string) => {
    navigate(`/discover?race=${raceId}`);
  };

  const featuredRaces = races?.slice(0, 3) || [];

  if (loading) {
    return (
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Carreras Destacadas
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Descubre algunas de las mejores carreras disponibles en nuestra plataforma
            </p>
          </div>
          <div className="text-center">Cargando carreras...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Carreras Destacadas
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Descubre algunas de las mejores carreras disponibles en nuestra plataforma
          </p>
        </div>

        {featuredRaces.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredRaces.map((race) => (
                <Card key={race.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewRaceDetails(race.id)}>
                  <div className="aspect-video bg-gradient-to-r from-runner-blue-500 to-runner-green-500 relative">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="font-bold text-lg">{race.name}</h3>
                    </div>
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-runner-blue-600">
                        {Array.isArray(race.distances) && race.distances.length > 0 
                          ? `${race.distances[0]} km` 
                          : 'Distancia variada'}
                      </Badge>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm">{race.host.rating || '4.5'}</span>
                      </div>
                    </div>
                    <CardTitle className="text-xl">{race.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{new Date(race.date).toLocaleDateString('es-ES')}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{race.location || 'Ubicación por confirmar'}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{race.maxGuests} plazas disponibles</span>
                      </div>
                      <p className="text-gray-700 text-sm line-clamp-2">
                        {race.highlights || 'Una experiencia única de running que no te puedes perder.'}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-lg font-bold text-runner-blue-600">
                          {race.pointsCost} puntos
                        </span>
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewRaceDetails(race.id);
                          }}
                          className="bg-runner-orange-500 hover:bg-runner-orange-600"
                        >
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button 
                onClick={handleViewAllRaces}
                className="bg-runner-blue-600 hover:bg-runner-blue-700 text-white px-8 py-3 text-lg"
              >
                Ver Todas las Carreras
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-6">
              Aún no hay carreras disponibles. ¡Sé el primero en crear una!
            </p>
            <Button 
              onClick={handleViewAllRaces}
              className="bg-runner-blue-600 hover:bg-runner-blue-700 text-white px-8 py-3"
            >
              Explorar Carreras
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedRacesSection;
