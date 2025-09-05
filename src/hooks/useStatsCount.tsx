import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StatsCount {
  activeUsers: number;
  locations: number;
  careers: number;
}

export const useStatsCount = () => {
  const [stats, setStats] = useState<StatsCount>({
    activeUsers: 0,
    locations: 0,
    careers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active users count
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) {
        console.error('Error fetching users count:', usersError);
        throw usersError;
      }

      // Fetch unique locations count (distinct localities from properties)
      const { data: locationsData, error: locationsError } = await supabase
        .from('properties')
        .select('locality')
        .neq('locality', null)
        .neq('locality', '');

      if (locationsError) {
        console.error('Error fetching locations:', locationsError);
        throw locationsError;
      }

      // Get unique locations count
      const uniqueLocalities = new Set(
        locationsData?.map(item => item.locality.trim().toLowerCase()) || []
      );
      const locationsCount = uniqueLocalities.size;

      // Fetch careers count (races)
      const { count: careersCount, error: careersError } = await supabase
        .from('races')
        .select('*', { count: 'exact', head: true });

      if (careersError) {
        console.error('Error fetching careers count:', careersError);
        throw careersError;
      }

      // Update stats
      setStats({
        activeUsers: usersCount || 0,
        locations: locationsCount,
        careers: careersCount || 0
      });

      console.log('Stats fetched successfully:', {
        activeUsers: usersCount || 0,
        locations: locationsCount,
        careers: careersCount || 0
      });

    } catch (err) {
      console.error('Error in fetchStats:', err);
      setError(err instanceof Error ? err.message : 'Error fetching stats');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscriptions for dynamic updates
  useEffect(() => {
    // Initial fetch
    fetchStats();

    // Subscribe to profiles table changes (users)
    const profilesSubscription = supabase
      .channel('profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          console.log('Profiles table changed, refetching stats...');
          fetchStats();
        }
      )
      .subscribe();

    // Subscribe to properties table changes (locations)
    const propertiesSubscription = supabase
      .channel('properties_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'properties'
        },
        () => {
          console.log('Properties table changed, refetching stats...');
          fetchStats();
        }
      )
      .subscribe();

    // Subscribe to races table changes (careers)
    const racesSubscription = supabase
      .channel('races_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'races'
        },
        () => {
          console.log('Races table changed, refetching stats...');
          fetchStats();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      profilesSubscription.unsubscribe();
      propertiesSubscription.unsubscribe();
      racesSubscription.unsubscribe();
    };
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};
