
import { useState, useEffect, useRef } from "react";
import { RaceService } from "@/services/raceService";
import { RaceFilters } from "@/types/race";
import { toast } from "sonner";

interface DiscoverRace {
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
}

export const useDiscoverRaces = () => {
  const [races, setRaces] = useState<DiscoverRace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchRaces = async (filters?: RaceFilters) => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      if (!mountedRef.current) return;
      
      setLoading(true);
      setError(null);
      console.log('Fetching races for discovery with filters:', filters);
      
      const data = await RaceService.fetchAllRaces(filters);
      console.log('Raw race data received:', data.length, 'races');
      
      if (!mountedRef.current) return;
      
      if (data.length === 0) {
        console.log('No races found in database');
        if (mountedRef.current) {
          setRaces([]);
        }
        return;
      }
      
      // Obtener imágenes para cada carrera
      const raceImagesPromises = data.map(async (race) => {
        try {
          const images = await RaceService.getRaceImages(race.id);
          const imageUrl = images.length > 0 ? images[0].image_url : "/placeholder.svg";
          return { ...race, imageUrl };
        } catch (error) {
          console.error('Error fetching race images for race:', race.id, error);
          return { ...race, imageUrl: "/placeholder.svg" };
        }
      });

      const racesWithImages = await Promise.all(raceImagesPromises);
      
      // Transformar los datos para que coincidan con la interfaz DiscoverRace
      const transformedRaces: DiscoverRace[] = racesWithImages.map(race => {
        console.log('Processing race:', race.name, 'Location:', race.start_location, 'Modalities:', race.modalities, 'Distances:', race.distances);
        
        // Calcular días hasta la carrera
        const raceDate = new Date(race.race_date);
        const today = new Date();
        const daysUntil = Math.ceil((raceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: race.id,
          name: race.name,
          location: race.start_location || race.property_info?.locality || "Ubicación no especificada",
          date: race.race_date,
          daysUntil: daysUntil,
          modalities: race.modalities || [],
          distances: race.distances || [],
          terrainProfile: race.terrain_profile || [],
          imageUrl: race.imageUrl,
          host: {
            id: race.host_id,
            name: race.host_info ? `${race.host_info.first_name || ''} ${race.host_info.last_name || ''}`.trim() : "Host Runner",
            rating: race.host_info?.average_rating || 4.5,
            verified: race.host_info?.verification_status === 'approved',
            imageUrl: race.host_info?.profile_image_url || "/placeholder.svg"
          },
          pointsCost: race.points_cost || 0,
          available: race.is_active,
          highlights: race.highlights || race.description || "Experiencia única de running",
          maxGuests: race.property_info?.max_guests || race.max_guests || 1
        };
      });
      
      console.log('Transformed races for discovery:', transformedRaces.length, 'races');
      if (transformedRaces.length > 0) {
        console.log('Sample transformed race:', transformedRaces[0]);
      }
      
      if (!mountedRef.current) return;
      
      setRaces(transformedRaces);
      
      if (transformedRaces.length === 0) {
        console.log('No races found with current filters:', filters);
        if (mountedRef.current) {
          toast.info('No se encontraron carreras con los filtros aplicados');
        }
      } else {
        console.log(`Found ${transformedRaces.length} races matching filters`);
      }
    } catch (error) {
      // Don't show errors if the request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Race fetch request was aborted');
        return;
      }
      
      if (!mountedRef.current) return;
      
      console.error('Error fetching races for discovery:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      if (mountedRef.current) {
        setError(`Error al cargar las carreras: ${errorMessage}`);
        toast.error('Error al cargar las carreras. Por favor, inténtalo de nuevo.');
        setRaces([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    console.log('useDiscoverRaces: Initial fetch');
    mountedRef.current = true;
    fetchRaces();
    
    // Cleanup function
    return () => {
      console.log('useDiscoverRaces: Cleaning up');
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    races,
    loading,
    error,
    fetchRaces,
    refetchRaces: fetchRaces
  };
};
