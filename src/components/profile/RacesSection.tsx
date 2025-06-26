
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trophy, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRaces } from "@/hooks/useRaces";
import { useEffect, useState } from "react";

const RacesSection = () => {
  const navigate = useNavigate();
  const { races, loading, forceRefresh } = useRaces();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Force refresh when component mounts and when returning to this section
  useEffect(() => {
    console.log('RacesSection mounted, forcing refresh...');
    forceRefresh();
  }, []);

  // Additional refresh when window gains focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      console.log('Window gained focus, refreshing races...');
      forceRefresh();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [forceRefresh]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await forceRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  console.log('RacesSection render - races:', races, 'loading:', loading);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando carreras...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-orange-600" />
            <span>Mis Carreras</span>
          </CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button 
              onClick={() => navigate("/races")}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Carrera
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!races || races.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes carreras registradas
            </h3>
            <p className="text-gray-600 mb-6">
              Comparte tu conocimiento local sobre carreras en tu ciudad
            </p>
            <Button 
              onClick={() => navigate("/races")}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primera Carrera
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Total de carreras: {races.length}
            </div>
            {races.map((race) => (
              <div key={race.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {race.name}
                    </h3>
                    {race.start_location && (
                      <div className="flex items-center text-gray-600 mt-1">
                        <span>{race.start_location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span>{new Date(race.race_date).toLocaleDateString('es-ES')}</span>
                      </div>
                      {race.distances && race.distances.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{race.distances.join(', ')}</span>
                        </>
                      )}
                      {race.modalities && race.modalities.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{race.modalities.join(', ')}</span>
                        </>
                      )}
                    </div>
                    {race.description && (
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                        {race.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col space-y-2">
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                    <div className="text-xs text-gray-500 text-center">
                      {race.points_cost} puntos
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RacesSection;
