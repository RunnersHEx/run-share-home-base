
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, MapPin, Users, Trophy, CheckCircle, XCircle, Clock } from "lucide-react";

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
  created_at: string;
  host_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const RaceVerificationPanel = () => {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchRaces();
  }, []);

  const fetchRaces = async () => {
    try {
      const { data, error } = await supabase
        .from('races')
        .select(`
          *,
          profiles:host_id (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching races:', error);
        toast.error('Error al cargar las carreras');
        return;
      }

      setRaces(data || []);
    } catch (error) {
      console.error('Exception fetching races:', error);
      toast.error('Error al cargar las carreras');
    } finally {
      setLoading(false);
    }
  };

  const handleRaceAction = async (raceId: string, action: 'approve' | 'reject') => {
    setActionLoading(raceId);
    
    try {
      const updates = {
        is_active: action === 'approve',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('races')
        .update(updates)
        .eq('id', raceId);

      if (error) {
        console.error(`Error ${action}ing race:`, error);
        toast.error(`Error al ${action === 'approve' ? 'aprobar' : 'rechazar'} la carrera`);
        return;
      }

      toast.success(`Carrera ${action === 'approve' ? 'aprobada' : 'rechazada'} exitosamente`);
      
      // Refrescar la lista
      await fetchRaces();
      
      // Limpiar notas admin
      setAdminNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[raceId];
        return newNotes;
      });

    } catch (error) {
      console.error(`Exception ${action}ing race:`, error);
      toast.error(`Error al ${action === 'approve' ? 'aprobar' : 'rechazar'} la carrera`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (race: Race) => {
    if (race.is_active) {
      return <Badge className="bg-green-100 text-green-800">Activa</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Inactiva</Badge>;
    }
  };

  const formatDistances = (distances: any) => {
    if (!distances) return 'No especificada';
    if (Array.isArray(distances)) {
      return distances.join(', ') + ' km';
    }
    return 'Distancia variada';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verificación de Carreras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando carreras...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-6 w-6 mr-2" />
            Verificación de Carreras
          </CardTitle>
          <p className="text-gray-600">
            Revisa y aprueba las carreras creadas por los hosts
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {races.length}
                  </p>
                  <p className="text-blue-600 font-medium">Total Carreras</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {races.filter(r => r.is_active).length}
                  </p>
                  <p className="text-green-600 font-medium">Activas</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {races.filter(r => !r.is_active).length}
                  </p>
                  <p className="text-red-600 font-medium">Inactivas</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {races.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay carreras para revisar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {races.map((race) => (
            <Card key={race.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{race.name}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(race.race_date).toLocaleDateString('es-ES')}
                      </span>
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {race.max_guests} plazas
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Host: {race.profiles?.first_name} {race.profiles?.last_name} ({race.profiles?.email})
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {getStatusBadge(race)}
                    <span className="text-sm font-medium text-blue-600">
                      {race.points_cost} puntos
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Detalles de la carrera:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{race.start_location || 'Ubicación no especificada'}</span>
                      </div>
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Distancias: {formatDistances(race.distances)}</span>
                      </div>
                    </div>
                  </div>

                  {race.description && (
                    <div>
                      <h4 className="font-medium mb-2">Descripción:</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        {race.description}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-2">Notas del administrador:</h4>
                    <Textarea
                      placeholder="Agregar comentarios sobre esta carrera..."
                      value={adminNotes[race.id] || ''}
                      onChange={(e) => setAdminNotes(prev => ({
                        ...prev,
                        [race.id]: e.target.value
                      }))}
                      className="text-sm"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    {!race.is_active && (
                      <Button
                        onClick={() => handleRaceAction(race.id, 'approve')}
                        disabled={actionLoading === race.id}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {actionLoading === race.id ? 'Procesando...' : 'Aprobar'}
                      </Button>
                    )}
                    
                    {race.is_active && (
                      <Button
                        onClick={() => handleRaceAction(race.id, 'reject')}
                        disabled={actionLoading === race.id}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {actionLoading === race.id ? 'Procesando...' : 'Desactivar'}
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Creada: {new Date(race.created_at).toLocaleDateString('es-ES')} a las {new Date(race.created_at).toLocaleTimeString('es-ES')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RaceVerificationPanel;
