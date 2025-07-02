
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Trophy, Plus, Edit, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RaceWizard from "@/components/races/RaceWizard";

interface Race {
  id: string;
  name: string;
  description: string;
  race_date: string;
  start_location: string;
  distances: any;
  max_guests: number;
  points_cost: number;
  is_active: boolean;
  total_bookings: number;
  average_rating: number;
}

const RacesSection = () => {
  const { user } = useAuth();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editingRace, setEditingRace] = useState<Race | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyRaces();
    }
  }, [user]);

  const fetchMyRaces = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching races for user:', user.id);
      
      const { data, error } = await supabase
        .from('races')
        .select('*')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user races:', error);
        toast.error('Error al cargar tus carreras');
        return;
      }

      console.log('Races fetched:', data);
      setRaces(data || []);
    } catch (error) {
      console.error('Exception fetching races:', error);
      toast.error('Error al cargar tus carreras');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRace = () => {
    setEditingRace(null);
    setShowWizard(true);
  };

  const handleEditRace = (race: Race) => {
    setEditingRace(race);
    setShowWizard(true);
  };

  const handleRaceSuccess = () => {
    setShowWizard(false);
    setEditingRace(null);
    fetchMyRaces(); // Refrescar la lista
    toast.success(editingRace ? 'Carrera actualizada exitosamente' : 'Carrera creada exitosamente');
  };

  const formatDistances = (distances: any) => {
    if (!distances) return 'No especificada';
    if (Array.isArray(distances)) {
      return distances.join(', ') + ' km';
    }
    return 'Distancia variada';
  };

  const getStatusBadge = (race: Race) => {
    if (race.is_active) {
      return <Badge className="bg-green-100 text-green-800">Activa</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Pendiente de aprobación</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mis Carreras</h2>
            <p className="text-gray-600">Gestiona las carreras que organizas</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando tus carreras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mis Carreras</h2>
          <p className="text-gray-600">Gestiona las carreras que organizas</p>
        </div>
        <Button onClick={handleCreateRace} className="bg-runner-blue-600 hover:bg-runner-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Carrera
        </Button>
      </div>

      {races.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aún no has creado ninguna carrera
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza organizando tu primera carrera y comparte tu pasión por el running
            </p>
            <Button onClick={handleCreateRace} className="bg-runner-blue-600 hover:bg-runner-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Crear Mi Primera Carrera
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {races.map((race) => (
            <Card key={race.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{race.name}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(race.race_date).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(race)}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">{race.start_location || 'Ubicación por definir'}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Trophy className="h-4 w-4 mr-2" />
                    <span className="text-sm">Distancias: {formatDistances(race.distances)}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="text-sm">{race.max_guests} participantes máximo</span>
                  </div>

                  {race.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {race.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="font-medium text-runner-blue-600">
                        {race.points_cost} puntos
                      </span>
                      <span className="text-gray-500">
                        {race.total_bookings} reservas
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditRace(race)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showWizard && (
        <RaceWizard
          isOpen={showWizard}
          onClose={() => {
            setShowWizard(false);
            setEditingRace(null);
          }}
          onSuccess={handleRaceSuccess}
          editingRace={editingRace}
        />
      )}
    </div>
  );
};

export default RacesSection;
