
import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { HeroSearchSection } from "@/components/discover/HeroSearchSection";
import { AdvancedFilters } from "@/components/discover/filters/AdvancedFilters";
import { RaceCard } from "@/components/discover/RaceCard";
import { RaceDetailModal } from "@/components/discover/RaceDetailModal";
import { ResultsHeader } from "@/components/discover/search/ResultsHeader";
import { EmptyState } from "@/components/discover/search/EmptyState";
import { RaceFilters as SearchFilters } from "@/types/race";
import { useDiscoverRaces } from "@/hooks/useDiscoverRaces";
import { toast } from "sonner";

const DiscoverRaces = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [savedRaces, setSavedRaces] = useState<string[]>([]);
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [showRaceDetail, setShowRaceDetail] = useState(false);
  const mountedRef = useRef(true);
  
  const { races, loading, error, fetchRaces } = useDiscoverRaces();

  // Load filters from URL parameters on component mount
  useEffect(() => {
    if (!mountedRef.current) return;
    
    const urlFilters: SearchFilters = {};
    
    const query = searchParams.get('q');
    const province = searchParams.get('province');
    const month = searchParams.get('month');
    const modality = searchParams.get('modality');
    const distance = searchParams.get('distance');
    
    if (query && mountedRef.current) {
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
    
    if (Object.keys(urlFilters).length > 0 && mountedRef.current) {
      setFilters(urlFilters);
      // Only add a tiny delay when coming from QuickSearchSection to prevent race condition
      setTimeout(() => {
        if (mountedRef.current) {
          fetchRaces(urlFilters);
        }
      }, 50); // Very small delay just to let component fully mount
    }
    
    // Cleanup function
    return () => {
      console.log('DiscoverRaces: Cleaning up URL params effect');
      mountedRef.current = false;
    };
  }, [searchParams]);
  
  // Component cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      console.log('DiscoverRaces: Component unmounting, cleaning up');
      mountedRef.current = false;
    };
  }, []);

  // Force component re-render when filters change
  const [, setForceUpdate] = useState({});
  const triggerUpdate = () => setForceUpdate({});

  const filteredRaces = useMemo(() => {
    const result = races.filter(race => {
      // Text search
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        const nameMatch = race.name.toLowerCase().includes(queryLower);
        const locationMatch = race.location.toLowerCase().includes(queryLower);
        if (!nameMatch && !locationMatch) {
          return false;
        }
      }
      
      // Province filter - check exact province match
      if (filters.province) {
        const filterProvince = filters.province.toLowerCase().trim();
        const raceProvince = (race.province || '').toLowerCase().trim();
        
        // Exact match on province field only
        if (raceProvince !== filterProvince) {
          return false;
        }
      }
      
      // Modality filter
      if (filters.modalities && filters.modalities.length > 0) {
        const hasMatchingModality = filters.modalities.some(modality => {
          return race.modalities.includes(modality);
        });
        if (!hasMatchingModality) {
          return false;
        }
      }
      
      // Distance filter
      if (filters.distances && filters.distances.length > 0) {
        const hasMatchingDistance = filters.distances.some(distance => {
          return race.distances.includes(distance);
        });
        if (!hasMatchingDistance) {
          return false;
        }
      }
      
      // Month filter
      if (filters.month) {
        const raceDate = new Date(race.date);
        const raceMonth = raceDate.getMonth() + 1;
        const filterMonth = parseInt(filters.month);
        if (raceMonth !== filterMonth) {
          return false;
        }
      }
      
      // Max guests filter
      if (filters.maxGuests && race.maxGuests && race.maxGuests < filters.maxGuests) {
        return false;
      }
      
      // Only show available races
      if (!race.available) {
        return false;
      }

      return true;
    });
    
    console.log('🎯 FILTER DEBUG - Total races:', races.length, 'Filtered result:', result.length, 'Filters:', filters);
    return result;
  }, [races, searchQuery, filters, JSON.stringify(filters)]);

  const handleSaveRace = (raceId: string) => {
    if (!mountedRef.current) return;
    
    setSavedRaces(prev => 
      prev.includes(raceId) 
        ? prev.filter(id => id !== raceId)
        : [...prev, raceId]
    );
  };

  const handleViewDetails = (race: any) => {
    if (!mountedRef.current) return;
    
    console.log('Opening race details for:', race.name);
    setSelectedRace(race);
    setShowRaceDetail(true);
  };

  const handleSearch = () => {
    console.log(`Searching races with filters:`, filters);
    fetchRaces(filters);
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    if (!mountedRef.current) return;
    setFilters(newFilters);
    triggerUpdate(); // Force re-render
  };

  const handleClearFilters = () => {
    if (!mountedRef.current) return;
    
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

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSearchSection 
        key={JSON.stringify(filters)} // Force re-render when filters change
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFiltersChange={handleFiltersChange}
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
            {(() => {
              console.log('🚀 BEFORE ResultsHeader - filteredRaces.length:', filteredRaces?.length, 'filteredRaces:', filteredRaces);
              return null;
            })()}
            <ResultsHeader
              key={`results-${filteredRaces?.length || 0}`}
              resultsCount={filteredRaces?.length || 0}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredRaces?.map((race) => (
                <RaceCard
                  key={race.id}
                  race={race}
                  isSaved={savedRaces.includes(race.id)}
                  onSave={() => handleSaveRace(race.id)}
                  onViewDetails={() => handleViewDetails(race)}
                  onAuthModal={(mode) => {
                    // For now, we'll just log this - in a real app you'd trigger the auth modal
                    console.log('Auth modal requested:', mode);
                    toast.error("Para continuar explorando esta experiencia, necesitas registrarte.");
                  }}
                />
              )) || []}
            </div>

            {/* Empty State */}
            {(!filteredRaces || filteredRaces.length === 0) && (
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
