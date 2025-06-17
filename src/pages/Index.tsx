import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Trophy, Heart, Search, Calendar, MessageCircle, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import AuthModal from "@/components/auth/AuthModal";

const Index = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [selectedRaceModalities, setSelectedRaceModalities] = useState<string[]>([]);
  const [selectedDistances, setSelectedDistances] = useState<string[]>([]);

  const openAuthModal = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleRaceModalityChange = (modality: string, checked: boolean) => {
    if (checked) {
      setSelectedRaceModalities([...selectedRaceModalities, modality]);
    } else {
      setSelectedRaceModalities(selectedRaceModalities.filter(m => m !== modality));
    }
  };

  const handleDistanceChange = (distance: string, checked: boolean) => {
    if (checked) {
      setSelectedDistances([...selectedDistances, distance]);
    } else {
      setSelectedDistances(selectedDistances.filter(d => d !== distance));
    }
  };

  const spanishProvinces = [
    "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", 
    "Islas Baleares", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", 
    "Castellón", "Ciudad Real", "Córdoba", "La Coruña", "Cuenca", "Gerona", 
    "Granada", "Guadalajara", "Guipúzcoa", "Huelva", "Huesca", "Jaén", "León", 
    "Lérida/Lleida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", 
    "Orense/Ourense", "Palencia", "Las Palmas", "Pontevedra", "La Rioja", 
    "Salamanca", "Segovia", "Sevilla", "Soria", "Tarragona", "Santa Cruz de Tenerife", 
    "Teruel", "Toledo", "Valencia", "Valladolid", "Vizcaya/Bizkaia", "Zamora", 
    "Zaragoza", "Ceuta", "Melilla"
  ];

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const raceModalities = ["Asfalto/Ruta", "Trail/Montaña"];
  
  const raceDistances = [
    "Maratón", "Media Maratón", "20k", "de 20k a 15k", "15k", 
    "10K", "de 10k a 5k", "5K", "Trail"
  ];

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden page-gradient">
        <div className="absolute inset-0 bg-runner-gradient opacity-5"></div>
        <div className="container mx-auto px-4 py-16 lg:py-24 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <img 
                src="/lovable-uploads/981505bd-2f25-4665-9b98-5496d5124ebe.png" 
                alt="Runners Home Exchange" 
                className="h-40 w-auto object-contain"
              />
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 animate-fade-in">
              Conecta • Viaja • <span className="bg-runner-gradient bg-clip-text text-transparent">Corre</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-8 animate-fade-in">
              La plataforma que conecta corredores locales con viajeros, 
              ofreciendo alojamiento auténtico y experiencia compartida
            </p>
            
            {/* Quick Search */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl max-w-4xl mx-auto mb-8 animate-slide-in-right">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destino</label>
                  <Select>
                    <SelectTrigger className="runner-input">
                      <SelectValue placeholder="Selecciona una provincia" />
                    </SelectTrigger>
                    <SelectContent>
                      {spanishProvinces.map((province) => (
                        <SelectItem key={province} value={province.toLowerCase()}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mes</label>
                  <Select>
                    <SelectTrigger className="runner-input">
                      <SelectValue placeholder="Selecciona un mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => (
                        <SelectItem key={month} value={(index + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Modalidad de Carrera</label>
                  <div className="space-y-2 p-3 border border-gray-300 rounded-md bg-white">
                    {raceModalities.map((modality) => (
                      <div key={modality} className="flex items-center space-x-2">
                        <Checkbox
                          id={`modality-${modality}`}
                          checked={selectedRaceModalities.includes(modality)}
                          onCheckedChange={(checked) => handleRaceModalityChange(modality, checked as boolean)}
                        />
                        <label
                          htmlFor={`modality-${modality}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {modality}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Distancia Carrera</label>
                  <div className="space-y-2 p-3 border border-gray-300 rounded-md bg-white max-h-32 overflow-y-auto">
                    {raceDistances.map((distance) => (
                      <div key={distance} className="flex items-center space-x-2">
                        <Checkbox
                          id={`distance-${distance}`}
                          checked={selectedDistances.includes(distance)}
                          onCheckedChange={(checked) => handleDistanceChange(distance, checked as boolean)}
                        />
                        <label
                          htmlFor={`distance-${distance}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {distance}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Button className="runner-button-primary w-full mt-6">
                <Search className="mr-2 h-5 w-5" />
                Buscar Carreras
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Button 
                onClick={() => openAuthModal("register")}
                className="runner-button-primary text-lg px-8 py-4"
              >
                Únete a la Comunidad
              </Button>
              <Button 
                onClick={() => openAuthModal("login")}
                className="runner-button-secondary text-lg px-8 py-4"
              >
                Iniciar Sesión
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              ¿Por qué elegir <span className="text-runner-blue-600">Runners Home Exchange</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Más que alojamiento, una experiencia completa para corredores apasionados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="runner-card text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-runner-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Conocimiento Local</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Hosts locales que conocen cada detalle de la carrera, rutas de entrenamiento y los mejores restaurantes
                </p>
              </CardContent>
            </Card>

            <Card className="runner-card text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-runner-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Comunidad Runner</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Conecta con corredores que entienden tus rutinas, horarios y la pasión por el running
                </p>
              </CardContent>
            </Card>

            <Card className="runner-card text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-runner-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Precio Justo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Sistema de puntos que evita los precios inflados durante fines de semana de carreras populares
                </p>
              </CardContent>
            </Card>

            <Card className="runner-card text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-runner-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Experiencia Auténtica</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Vive la carrera como un local, con despertares tempranos compartidos y celebraciones post-carrera
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Races */}
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

      {/* How it Works */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              ¿Cómo <span className="text-runner-blue-600">Funciona</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tres simples pasos para tu próxima aventura running
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-runner-gradient rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Busca y Solicita</h3>
              <p className="text-gray-600">
                Explora carreras por ubicación y fecha. Envía una solicitud al host local que más te interese.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-runner-gradient rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Conecta y Planifica</h3>
              <p className="text-gray-600">
                Una vez aceptado, coordina con tu host los detalles del viaje, entrenamiento y logística de carrera.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-runner-gradient rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Vive la Experiencia</h3>
              <p className="text-gray-600">
                Disfruta del alojamiento, conocimiento local y la compañía de un fellow runner en tu carrera.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-runner-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            ¿Listo para tu próxima aventura?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Únete a nuestra comunidad de corredores apasionados y descubre una nueva forma de viajar y correr.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => openAuthModal("register")}
              className="bg-white text-runner-blue-600 hover:bg-gray-100 text-lg px-8 py-4 font-semibold"
            >
              Crear Cuenta Gratis
            </Button>
            <Button 
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-runner-blue-600 text-lg px-8 py-4 font-semibold"
            >
              Explorar Carreras
            </Button>
          </div>
        </div>
      </section>

      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
};

export default Index;
