
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Star } from "lucide-react";

const FeaturedRacesSection = () => {
  const featuredRaces = [
    {
      id: 1,
      name: "Maratón de Barcelona",
      date: "15 Mar 2025",
      location: "Barcelona, España",
      distance: "42.2 km",
      terrain: "Asfalto",
      difficulty: "Intermedio",
      points: 150,
      host: "Carlos Ruiz",
      hostImage: "/placeholder.svg",
      raceImage: "/placeholder.svg",
      description: "Recorre las calles más emblemáticas de Barcelona con vistas al mar"
    },
    {
      id: 2,
      name: "Trail Picos de Europa",
      date: "22 Jun 2025",
      location: "Asturias, España",
      distance: "25 km",
      terrain: "Montaña",
      difficulty: "Avanzado",
      points: 200,
      host: "María González",
      hostImage: "/placeholder.svg",
      raceImage: "/placeholder.svg",
      description: "Una aventura única por paisajes impresionantes de montaña"
    },
    {
      id: 3,
      name: "Media Maratón Valencia",
      date: "28 Oct 2025",
      location: "Valencia, España",
      distance: "21.1 km",
      terrain: "Asfalto",
      difficulty: "Principiante",
      points: 120,
      host: "Javier López",
      hostImage: "/placeholder.svg",
      raceImage: "/placeholder.svg",
      description: "Circuito rápido y plano, perfecto para marcas personales"
    }
  ];

  return (
    <section className="py-16 lg:py-24 page-gradient">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Carreras <span className="text-runner-orange-500">Destacadas</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descubre increíbles carreras con hosts locales esperándote
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredRaces.map((race) => (
            <Card key={race.id} className="runner-card overflow-hidden hover:scale-105 transition-transform duration-300">
              <div className="h-48 bg-runner-gradient-light relative">
                <img 
                  src={race.raceImage} 
                  alt={race.name} 
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-4 right-4 bg-runner-orange-500 text-white">
                  {race.points} puntos
                </Badge>
              </div>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-xl font-bold text-gray-900">{race.name}</CardTitle>
                  <Badge variant="outline" className="text-runner-blue-600">
                    {race.difficulty}
                  </Badge>
                </div>
                <CardDescription className="space-y-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {race.date}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {race.location}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{race.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm">
                    <span className="font-semibold">{race.distance}</span> • <span className="text-gray-600">{race.terrain}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img 
                      src={race.hostImage} 
                      alt={race.host} 
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <span className="text-sm text-gray-600">Host: {race.host}</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="text-sm">4.9</span>
                  </div>
                </div>
                <Button className="w-full mt-4 runner-button-primary">
                  Ver Detalles
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button className="runner-button-secondary text-lg px-8 py-4">
            Ver Todas las Carreras
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedRacesSection;
