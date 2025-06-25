
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
import { RaceDetailModal } from "@/components/discover/RaceDetailModal";
import { RaceFilters as SearchFilters } from "@/types/race";
import { useDiscoverRaces } from "@/hooks/useDiscoverRaces";
import { toast } from "sonner";

const DiscoverRaces = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [savedRaces, setSavedRaces] = useState<string[]>([]);
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [showRaceDetail, setShowRaceDetail] = useState(false);
  
  // Use the new discover races hook
  const { races, loading, fetchRaces } = useDiscoverRaces();

  const filteredRaces = useMemo(() => {
    return races.filter(race => {
      // Text search
      if (searchQuery && !race.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !race.location.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Province filter
      if (filters.province && !race.location.toLowerCase().includes(filters.province.toLowerCase())) {
        return false;
      }
      
      // Modality filter
      if (filters.modalities && filters.modalities.length > 0) {
        const hasMatchingModality = filters.modalities.some(modality => 
          race.modalities.includes(modality)
        );
        if (!hasMatchingModality) return false;
      }
      
      // Distance filter
      if (filters.distances && filters.distances.length > 0) {
        const hasMatchingDistance = filters.distances.some(distance => 
          race.distances.includes(distance)
        );
        if (!hasMatchingDistance) return false;
      }
      
      // Month filter
      if (filters.month) {
        const raceMonth = new Date(race.date).getMonth() + 1;
        const filterMonth = parseInt(filters.month);
        if (raceMonth !== filterMonth) return false;
      }
      
      // Max guests filter
      if (filters.maxGuests && race.maxGuests && race.maxGuests < filters.maxGuests) {
        return false;
      }
      
      // Only show available races
      return race.available;
    });
  }, [races, searchQuery, filters]);

  const handleSaveRace = (raceId: string) => {
    setSavedRaces(prev => 
      prev.includes(raceId) 
        ? prev.filter(id => id !== raceId)
        : [...prev, raceId]
    );
  };

  const handleViewDetails = (race: any) => {
    setSelectedRace(race);
    setShowRaceDetail(true);
  };

  const handleSearch = () => {
    toast.success(`Buscando carreras con los filtros aplicados...`);
    fetchRaces(filters);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1E40AF]"></div>
      </div>
    );
  }

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
              onSearch={handleSearch}
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
                    onViewDetails={() => handleViewDetails(race)}
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

      {/* Race Detail Modal */}
      {selectedRace && (
        <RaceDetailModal
          race={selectedRace}
          isOpen={showRaceDetail}
          onClose={() => {
            setShowRaceDetail(false);
            setSelectedRace(null);
          }}
        />
      )}
    </div>
  );
};

export default DiscoverRaces;
