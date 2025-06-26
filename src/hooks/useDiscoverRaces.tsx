
import { useState, useEffect } from "react";
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

  const fetchRaces = async (filters?: RaceFilters) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching races for discovery with filters:', filters);
      
      const data = await RaceService.fetchAllRaces(filters);
      console.log('Raw race data received:', data.length, 'races');
      
      if (data.length === 0) {
        console.log('No races found in database');
        setRaces([]);
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
        
        return {
          id: race.id,
          name: race.name,
          location: race.start_location || race.property_info?.locality || "Ubicación no especificada",
          date: race.race_date,
          daysUntil: Math.ceil((new Date(race.race_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
          modalities: Array.isArray(race.modalities) ? race.modalities : [],
          distances: Array.isArray(race.distances) ? race.distances : [],
          terrainProfile: Array.isArray(race.terrain_profile) ? race.terrain_profile : [],
          imageUrl: race.imageUrl,
          host: {
            id: race.host_id,
            name: race.host_info ? `${race.host_info.first_name} ${race.host_info.last_name}` : "Host Runner",
            rating: race.host_info?.average_rating || 4.5,
            verified: race.host_info?.verification_status === 'approved',
            imageUrl: race.host_info?.profile_image_url || "/placeholder.svg"
          },
          pointsCost: race.points_cost,
          available: race.is_active,
          highlights: race.highlights || race.description || "Experiencia única de running",
          maxGuests: race.property_info?.max_guests || race.max_guests
        };
      });
      
      console.log('Transformed races for discovery:', transformedRaces.length, 'races');
      console.log('Sample transformed race:', transformedRaces[0]);
      setRaces(transformedRaces);
      
      if (transformedRaces.length === 0) {
        console.log('No races found with current filters:', filters);
        toast.info('No se encontraron carreras con los filtros aplicados');
      } else {
        console.log(`Found ${transformedRaces.length} races matching filters`);
      }
    } catch (error) {
      console.error('Error fetching races for discovery:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al cargar las carreras: ${errorMessage}`);
      toast.error('Error al cargar las carreras');
      setRaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useDiscoverRaces: Initial fetch');
    fetchRaces();
  }, []);

  return {
    races,
    loading,
    error,
    fetchRaces,
    refetchRaces: fetchRaces
  };
};
