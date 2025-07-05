
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { HeroSearchSection } from "@/components/discover/HeroSearchSection";
import { AdvancedFilters } from "@/components/discover/filters/AdvancedFilters";
import { RaceCard } from "@/components/discover/RaceCard";
import { RaceDetailModal } from "@/components/discover/RaceDetailModal";
import { ResultsHeader } from "@/components/discover/search/ResultsHeader";
import { EmptyState } from "@/components/discover/search/EmptyState";
import { MapView } from "@/components/discover/search/MapView";
import { RaceFilters as SearchFilters } from "@/types/race";
import { useDiscoverRaces } from "@/hooks/useDiscoverRaces";
import { toast } from "sonner";

const DiscoverRaces = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [savedRaces, setSavedRaces] = useState<string[]>([]);
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [showRaceDetail, setShowRaceDetail] = useState(false);
  
  const { races, loading, error, fetchRaces } = useDiscoverRaces();

  // Load filters from URL parameters on component mount
  useEffect(() => {
    const urlFilters: SearchFilters = {};
    
    const query = searchParams.get('q');
    const province = searchParams.get('province');
    const month = searchParams.get('month');
    const modality = searchParams.get('modality');
    const distance = searchParams.get('distance');
    
    if (query) {
      setSearchQuery(query);
    }
    
    if (province) {
      urlFilters.province = province;
    }
    
    if (month) {
      urlFilters.month = month;
    }
    
    if (modality) {
      urlFilters.modalities = [modality as any];
    }
    
    if (distance) {
      urlFilters.distances = [distance as any];
    }

    console.log('DiscoverRaces: Loading filters from URL:', urlFilters);
    
    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
      fetchRaces(urlFilters);
    }
  }, [searchParams]);

  const filteredRaces = useMemo(() => {
    console.log('Filtering races. Total races:', races.length);
    console.log('Applied filters:', filters);
    console.log('Search query:', searchQuery);

    return races.filter(race => {
      // Text search
      if (searchQuery && !race.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !race.location.toLowerCase().includes(searchQuery.toLowerCase())) {
        console.log(`Race ${race.name} filtered out by text search`);
        return false;
      }
      
      // Province filter
      if (filters.province && !race.location.toLowerCase().includes(filters.province.toLowerCase())) {
        console.log(`Race ${race.name} filtered out by province. Location: ${race.location}, Filter: ${filters.province}`);
        return false;
      }
      
      // Modality filter
      if (filters.modalities && filters.modalities.length > 0) {
        const hasMatchingModality = filters.modalities.some(modality => 
          race.modalities.includes(modality)
        );
        if (!hasMatchingModality) {
          console.log(`Race ${race.name} filtered out by modality`);
          return false;
        }
      }
      
      // Distance filter
      if (filters.distances && filters.distances.length > 0) {
        const hasMatchingDistance = filters.distances.some(distance => 
          race.distances.includes(distance)
        );
        if (!hasMatchingDistance) {
          console.log(`Race ${race.name} filtered out by distance`);
          return false;
        }
      }
      
      // Month filter
      if (filters.month) {
        const raceMonth = new Date(race.date).getMonth() + 1;
        const filterMonth = parseInt(filters.month);
        if (raceMonth !== filterMonth) {
          console.log(`Race ${race.name} filtered out by month. Race month: ${raceMonth}, Filter month: ${filterMonth}`);
          return false;
        }
      }
      
      // Max guests filter
      if (filters.maxGuests && race.maxGuests && race.maxGuests < filters.maxGuests) {
        console.log(`Race ${race.name} filtered out by max guests`);
        return false;
      }
      
      // Only show available races
      if (!race.available) {
        console.log(`Race ${race.name} filtered out - not available`);
        return false;
      }

      console.log(`Race ${race.name} passed all filters`);
      return true;
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
    console.log('Opening race details for:', race.name);
    setSelectedRace(race);
    setShowRaceDetail(true);
  };

  const handleSearch = () => {
    console.log(`Searching races with filters:`, filters);
    fetchRaces(filters);
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    console.log('Filters changed:', newFilters);
    setFilters(newFilters);
    fetchRaces(newFilters);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilters({});
    fetchRaces();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1E40AF]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error al cargar carreras</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => fetchRaces()}
            className="bg-[#1E40AF] text-white px-6 py-2 rounded-lg hover:bg-[#1E40AF]/90"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  console.log('Rendering DiscoverRaces. Filtered races:', filteredRaces.length);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSearchSection 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Advanced Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-80 flex-shrink-0`}>
            <AdvancedFilters 
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClose={() => setShowFilters(false)}
              onSearch={handleSearch}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <ResultsHeader
              resultsCount={filteredRaces.length}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

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
              <MapView />
            )}

            {/* Empty State */}
            {filteredRaces.length === 0 && (
              <EmptyState onClearFilters={handleClearFilters} />
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
