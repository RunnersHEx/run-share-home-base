
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
                  <RaceCard
                    key={race.id}
                    race={race}
                    isSaved={savedRaces.includes(race.id)}
                    onSave={() => handleSaveRace(race.id)}
                    onViewDetails={() => console.log("View details for race:", race.id)}
                  />
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
