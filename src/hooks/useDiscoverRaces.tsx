
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

  const fetchRaces = async (filters?: RaceFilters) => {
    try {
      setLoading(true);
      console.log('Fetching races for discovery with filters:', filters);
      const data = await RaceService.fetchAllRaces(filters);
      
      // Get race images for each race
      const raceImagesPromises = data.map(async (race) => {
        try {
          const images = await RaceService.getRaceImages(race.id);
          // Use the first image if available, otherwise fallback to placeholder
          const imageUrl = images.length > 0 ? images[0].image_url : "/placeholder.svg";
          return { ...race, imageUrl };
        } catch (error) {
          console.error('Error fetching race images for race:', race.id, error);
          return { ...race, imageUrl: "/placeholder.svg" };
        }
      });

      const racesWithImages = await Promise.all(raceImagesPromises);
      
      // Transform the data to match the DiscoverRace interface
      const transformedRaces: DiscoverRace[] = racesWithImages.map(race => ({
        id: race.id,
        name: race.name,
        location: race.start_location || race.property_info?.locality || "Ubicación no especificada",
        date: race.race_date,
        daysUntil: Math.ceil((new Date(race.race_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        modalities: race.modalities || [],
        distances: race.distances || [],
        terrainProfile: race.terrain_profile || [],
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
        maxGuests: race.property_info?.max_guests
      }));
      
      console.log('Transformed races for discovery:', transformedRaces);
      setRaces(transformedRaces);
    } catch (error) {
      console.error('Error fetching races for discovery:', error);
      toast.error('Error al cargar las carreras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRaces();
  }, []);

  return {
    races,
    loading,
    fetchRaces,
    refetchRaces: fetchRaces
  };
};
