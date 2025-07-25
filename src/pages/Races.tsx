import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useRaces } from "@/hooks/useRaces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trophy, MapPin, Calendar, Users } from "lucide-react";
import { useState } from "react";
import { RaceWizard } from "@/components/races/RaceWizard";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const Races = () => {
  const { races, loading, error, refetchRaces } = useRaces();
  const [showWizard, setShowWizard] = useState(false);
  const [editingRace, setEditingRace] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleCreateRace = () => {
    setEditingRace(null);
    setIsEditMode(false);
    setShowWizard(true);
  };

  const handleEditRace = (race: any) => {
    setEditingRace(race);
    setIsEditMode(true);
    setShowWizard(true);
  };

  const handleWizardSuccess = () => {
    setShowWizard(false);
    setEditingRace(null);
    setIsEditMode(false);
    // Refresh races to show the new/updated race immediately
    setTimeout(() => {
      refetchRaces();
    }, 500);
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    setEditingRace(null);
    setIsEditMode(false);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Carreras</h1>
            <p className="text-gray-600">Gestiona las carreras que ofreces como host</p>
          </div>
          <Button onClick={handleCreateRace} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Agregar Carrera</span>
          </Button>
        </div>

        {error && (
          <Card className="mb-6">
            <CardContent className="p-6 text-center text-red-600">
              Error al cargar las carreras. Por favor, intenta de nuevo.
            </CardContent>
          </Card>
        )}

        {!races || races.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tienes carreras aún</h3>
              <p className="text-gray-600 mb-6">
                Comienza agregando tu primera carrera para conectar con runners que buscan experiencias auténticas
              </p>
              <Button onClick={handleCreateRace} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Agregar Mi Primera Carrera</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {races.map((race) => (
              <Card key={race.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Trophy className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant={race.is_active ? "default" : "secondary"}>
                      {race.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{race.name}</CardTitle>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(race.race_date), "d 'de' MMMM, yyyy", { locale: es })}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      {race.province || 'Ubicación por definir'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {race.max_guests} runners max
                      </span>
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {race.distance_from_property || 0}km
                      </span>
                    </div>
                  </div>
                  
                  {race.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {race.description}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">
                      {race.total_bookings} reservas
                    </span>
                    <div className="flex items-center text-sm font-medium text-blue-600">
                      {race.points_cost} puntos
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditRace(race)}>
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showWizard && (
          <RaceWizard
            onClose={handleCloseWizard}
            onSuccess={handleWizardSuccess}
            editingRace={editingRace}
            isEditMode={isEditMode}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

export default Races;