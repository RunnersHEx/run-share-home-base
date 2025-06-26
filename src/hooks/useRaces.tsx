
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
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
      if (!raceData.name || !raceData.race_date || !raceData.property_id) {
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

      const data = await RaceService.createRace(raceData, user.id);
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
      await RaceService.updateRace(id, updates);
      await fetchRaces();
      toast.success('Carrera actualizada correctamente');
      return true;
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
