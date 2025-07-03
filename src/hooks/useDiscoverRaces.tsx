
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
        
        // Calcular días hasta la carrera
        const raceDate = new Date(race.race_date);
        const today = new Date();
        const daysUntil = Math.ceil((raceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Asegurar que modalities y distances son arrays
        const modalities = Array.isArray(race.modalities) ? race.modalities : [];
        const distances = Array.isArray(race.distances) ? race.distances : [];
        const terrainProfile = Array.isArray(race.terrain_profile) ? race.terrain_profile : [];
        
        // Obtener información de la propiedad
        const propertyInfo = Array.isArray(race.property_info) ? race.property_info[0] : race.property_info;
        
        // Obtener información del host
        const hostInfo = race.host_info || {};
        
        return {
          id: race.id,
          name: race.name,
          location: race.start_location || propertyInfo?.locality || "Ubicación no especificada",
          date: race.race_date,
          daysUntil: daysUntil,
          modalities: modalities,
          distances: distances,
          terrainProfile: terrainProfile,
          imageUrl: race.imageUrl,
          host: {
            id: race.host_id,
            name: hostInfo.first_name && hostInfo.last_name ? 
                  `${hostInfo.first_name} ${hostInfo.last_name}`.trim() : "Host Runner",
            rating: hostInfo.average_rating || 4.5,
            verified: hostInfo.verification_status === 'approved',
            imageUrl: hostInfo.profile_image_url || "/placeholder.svg"
          },
          pointsCost: race.points_cost || 0,
          available: race.is_active,
          highlights: race.highlights || race.description || "Experiencia única de running",
          maxGuests: propertyInfo?.max_guests || race.max_guests || 1
        };
      });
      
      console.log('Transformed races for discovery:', transformedRaces.length, 'races');
      if (transformedRaces.length > 0) {
        console.log('Sample transformed race:', transformedRaces[0]);
      }
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
      toast.error('Error al cargar las carreras. Por favor, inténtalo de nuevo.');
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
