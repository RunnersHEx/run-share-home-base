
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Race, RaceFormData, RaceFilters } from "@/types/race";
import { RaceService } from "@/services/raceService";

export const useRaces = () => {
  const { user } = useAuth();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRaces: 0,
    bookingsThisYear: 0,
    averageRating: 0
  });

  const fetchRaces = async (filters?: RaceFilters) => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Fetching races for user:', user.id);
      const data = await RaceService.fetchHostRaces(user.id, filters);
      console.log('Fetched races:', data);
      setRaces(data);
    } catch (error) {
      console.error('Error fetching races:', error);
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
      console.error('Error fetching stats:', error);
    }
  };

  const createRace = async (raceData: RaceFormData) => {
    if (!user) return null;

    try {
      console.log('Creating race with data:', raceData);
      const data = await RaceService.createRace(raceData, user.id);
      console.log('Created race:', data);
      
      // Immediately refresh races to show the new one
      await fetchRaces();
      await fetchStats();
      toast.success('Carrera creada correctamente');
      return data;
    } catch (error) {
      console.error('Error creating race:', error);
      toast.error('Error al crear la carrera');
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
      console.error('Error updating race:', error);
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
      console.error('Error deleting race:', error);
      toast.error('Error al eliminar la carrera');
      return false;
    }
  };

  // Force refresh function for when user navigates back
  const forceRefresh = async () => {
    console.log('Force refreshing races...');
    await fetchRaces();
  };

  useEffect(() => {
    if (user) {
      console.log('useRaces: User detected, fetching races');
      fetchRaces();
      fetchStats();
    }
  }, [user]);

  // Add visibility change listener to refresh when user comes back to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('Tab became visible, refreshing races');
        fetchRaces();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  return {
    races,
    loading,
    stats,
    fetchRaces,
    createRace,
    updateRace,
    deleteRace,
    forceRefresh,
    refetchRaces: fetchRaces
  };
};
