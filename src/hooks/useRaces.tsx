
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Race, RaceFormData, RaceFilters } from "@/types/race";
import { RaceService } from "@/services/raceService";

export const useRaces = () => {
  const { user } = useAuth();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalRaces: 0,
    bookingsThisYear: 0,
    averageRating: 0
  });

  const fetchRaces = async (filters?: RaceFilters) => {
    if (!user) {
      console.log('useRaces: No user found, skipping fetch');
      setRaces([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('useRaces: Fetching races for user:', user.id);
      
      const data = await RaceService.fetchHostRaces(user.id, filters);
      console.log('useRaces: Fetched races:', data);
      
      if (Array.isArray(data)) {
        setRaces(data);
      } else {
        console.warn('useRaces: Received non-array data:', data);
        setRaces([]);
      }
    } catch (error) {
      console.error('useRaces: Error fetching races:', error);
      setError('Error al cargar las carreras');
      setRaces([]);
      toast.error('Error al cargar las carreras');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      const statsData = await RaceService.getRaceStats(user.id);
      setStats(statsData);
    } catch (error) {
      console.error('useRaces: Error fetching stats:', error);
    }
  };

  const createRace = async (raceData: RaceFormData) => {
    if (!user) {
      console.log('useRaces: No user found for createRace');
      toast.error('Usuario no autenticado');
      return null;
    }

    try {
      console.log('useRaces: Creating race with data:', raceData);
      
      // Validate required fields
      if (!raceData.name || !raceData.province || !raceData.race_date || !raceData.property_id) {
        toast.error('Por favor completa todos los campos obligatorios');
        return null;
      }

      if (!raceData.modalities || raceData.modalities.length === 0) {
        toast.error('Por favor selecciona al menos una modalidad');
        return null;
      }

      if (!raceData.distances || raceData.distances.length === 0) {
        toast.error('Por favor selecciona al menos una distancia');
        return null;
      }

      if (!raceData.max_guests || raceData.max_guests < 1 || raceData.max_guests > 4) {
        toast.error('El número máximo de huéspedes debe ser entre 1 y 4');
        return null;
      }

      // Handle registration_deadline validation and default setting
      const raceDate = new Date(raceData.race_date);
      let registrationDeadline = raceData.registration_deadline;
      
      if (!registrationDeadline) {
        // Set default registration deadline to 7 days before race date
        const defaultDeadline = new Date(raceDate);
        defaultDeadline.setDate(raceDate.getDate() - 7);
        registrationDeadline = defaultDeadline.toISOString().split('T')[0];
        console.log('useRaces: Setting default registration deadline:', registrationDeadline);
      } else {
        // Validate that registration deadline is before race date
        const deadlineDate = new Date(registrationDeadline);
        if (deadlineDate >= raceDate) {
          toast.error('La fecha límite de inscripción debe ser anterior a la fecha de la carrera');
          return null;
        }
      }

      // Update race data with the validated/default registration deadline
      const validatedRaceData = {
        ...raceData,
        registration_deadline: registrationDeadline
      };
      
      console.log('useRaces: Creating race with validated data:', validatedRaceData);

      const data = await RaceService.createRace(validatedRaceData, user.id);
      console.log('useRaces: Created race:', data);
      
      if (data) {
        // Immediately refresh races to show the new one
        await fetchRaces();
        await fetchStats();
        toast.success('Carrera creada correctamente');
        return data;
      } else {
        toast.error('Error al crear la carrera');
        return null;
      }
    } catch (error) {
      console.error('useRaces: Error creating race:', error);
      toast.error('Error al crear la carrera. Por favor intenta de nuevo.');
      return null;
    }
  };

  const updateRace = async (id: string, updates: Partial<RaceFormData>) => {
    try {
      console.log('🔄 useRaces: Starting race update for ID:', id);
      console.log('🔄 useRaces: Updates to apply:', updates);
      
      // Get the updated race data from server
      const updatedRace = await RaceService.updateRace(id, updates);
      console.log('✅ useRaces: Race updated in database:', updatedRace);
      console.log('🎯 useRaces: Updated race distances:', updatedRace.distances);
      console.log('🎯 useRaces: Updated race max_guests:', updatedRace.max_guests);
      console.log('🎯 useRaces: Updated race date:', updatedRace.race_date);
      
      // Immediately update local state with the server response
      setRaces(prevRaces => {
        const newRaces = prevRaces.map(race => {
          if (race.id === id) {
            console.log('🔄 useRaces: Replacing race in state. Old:', race);
            console.log('🔄 useRaces: Replacing race in state. New:', updatedRace);
            return updatedRace;
          }
          return race;
        });
        console.log('✅ useRaces: State updated with new races array');
        return newRaces;
      });
      
      toast.success('Carrera actualizada correctamente');
      return updatedRace; // Return the updated race data instead of just true
    } catch (error) {
      console.error('useRaces: Error updating race:', error);
      toast.error('Error al actualizar la carrera');
      return false;
    }
  };

  const deleteRace = async (id: string) => {
    try {
      await RaceService.deleteRace(id);
      await fetchRaces();
      await fetchStats();
      toast.success('Carrera eliminada correctamente');
      return true;
    } catch (error) {
      console.error('useRaces: Error deleting race:', error);
      toast.error('Error al eliminar la carrera');
      return false;
    }
  };

  // Force refresh function for when user navigates back
  const forceRefresh = async () => {
    console.log('useRaces: Force refreshing races...');
    if (user) {
      await fetchRaces();
      await fetchStats();
    }
  };

  useEffect(() => {
    if (user) {
      console.log('useRaces: User detected, fetching races');
      fetchRaces();
      fetchStats();
    } else {
      console.log('useRaces: No user, clearing races');
      setRaces([]);
      setStats({ totalRaces: 0, bookingsThisYear: 0, averageRating: 0 });
      setLoading(false);
      setError(null);
    }
  }, [user]);

  return {
    races,
    loading,
    error,
    stats,
    fetchRaces,
    createRace,
    updateRace,
    deleteRace,
    forceRefresh,
    refetchRaces: fetchRaces
  };
};
