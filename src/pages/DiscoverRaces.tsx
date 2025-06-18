
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  MapPin, 
  Calendar, 
  Filter, 
  Grid3X3, 
  Map as MapIcon,
  Star,
  Clock,
  Trophy,
  Heart
} from "lucide-react";
import { HeroSearchSection } from "@/components/discover/HeroSearchSection";
import { AdvancedFilters } from "@/components/discover/AdvancedFilters";
import { RaceCard } from "@/components/discover/RaceCard";
import { RaceFilters as SearchFilters } from "@/types/race";

// Mock data - replace with actual data from hooks
const mockRaces = [
  {
    id: "1",
    name: "Maratón Internacional de Barcelona",
    location: "Barcelona, Catalunya",
    date: "2024-03-10",
    daysUntil: 45,
    modalities: ["road"],
    distances: ["marathon", "half_marathon"],
    terrainProfile: ["flat"],
    imageUrl: "/placeholder.svg",
    host: {
      id: "host1",
      name: "Carlos Ruiz",
      rating: 4.8,
      verified: true,
      imageUrl: "/placeholder.svg"
    },
    pointsCost: 250,
    available: true,
    highlights: "Recorrido icónico por el centro histórico"
  },
  {
    id: "2", 
    name: "Trail de los Picos de Europa",
    location: "Asturias",
    date: "2024-04-15",
    daysUntil: 80,
    modalities: ["trail"],
    distances: ["ultra", "marathon"],
    terrainProfile: ["hilly"],
    imageUrl: "/placeholder.svg",
    host: {
      id: "host2",
      name: "Ana García",
      rating: 4.9,
      verified: true,
      imageUrl: "/placeholder.svg"
    },
    pointsCost: 300,
    available: true,
    highlights: "Vistas espectaculares de montaña"
  }
];

const DiscoverRaces = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [savedRaces, setSavedRaces] = useState<string[]>([]);

  const filteredRaces = useMemo(() => {
    return mockRaces.filter(race => {
      if (searchQuery && !race.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !race.location.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      if (filters.modality && !race.modalities.includes(filters.modality)) {
        return false;
      }
      
      if (filters.distance && !race.distances.includes(filters.distance)) {
        return false;
      }
      
      return true;
    });
  }, [searchQuery, filters]);

  const handleSaveRace = (raceId: string) => {
    setSavedRaces(prev => 
      prev.includes(raceId) 
        ? prev.filter(id => id !== raceId)
        : [...prev, raceId]
    );
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Search Section */}
      <HeroSearchSection 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Advanced Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-80 flex-shrink-0`}>
            <AdvancedFilters 
              filters={filters}
              onFiltersChange={setFilters}
              onClose={() => setShowFilters(false)}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {filteredRaces.length} carreras encontradas
                </h2>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex border rounded-lg p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="px-3"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "map" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("map")}
                    className="px-3"
                  >
                    <MapIcon className="w-4 h-4" />
                  </Button>
                </div>

                {/* Sort Dropdown */}
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                >
                  <option value="relevance">Más relevante</option>
                  <option value="date">Fecha más próxima</option>
                  <option value="points">Menor costo puntos</option>
                  <option value="rating">Mejor valorado</option>
                </select>
              </div>
            </div>

            {/* Results Grid */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredRaces.map((race) => (
                  <Card key={race.id} className="hover:shadow-lg transition-all duration-300 overflow-hidden">
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
                        onClick={() => handleSaveRace(race.id)}
                      >
                        <Heart 
                          className={`w-4 h-4 ${
                            savedRaces.includes(race.id) 
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
                          >
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Vista de mapa en desarrollo</p>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredRaces.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No se encontraron carreras
                </h3>
                <p className="text-gray-600 mb-6">
                  Prueba ajustando tus filtros de búsqueda para encontrar más opciones
                </p>
                <Button 
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({});
                  }}
                  variant="outline"
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoverRaces;
