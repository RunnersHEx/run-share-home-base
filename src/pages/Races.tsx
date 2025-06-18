
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Star, Trophy, Target, TrendingUp, Plus } from "lucide-react";
import { useRaces } from "@/hooks/useRaces";
import { RaceFilters } from "@/types/race";
import { RaceWizard } from "@/components/races/RaceWizard";
import { RaceFiltersComponent } from "@/components/races/RaceFiltersComponent";

const Races = () => {
  const { races, loading, stats } = useRaces();
  const [showWizard, setShowWizard] = useState(false);
  const [filters, setFilters] = useState<RaceFilters>({});

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getModalityBadgeColor = (modality: string) => {
    return modality === 'road' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  const getDistanceBadgeColor = (distance: string) => {
    const colors = {
      'ultra': 'bg-red-100 text-red-800',
      'marathon': 'bg-orange-100 text-orange-800',
      'half_marathon': 'bg-yellow-100 text-yellow-800',
      '20k': 'bg-green-100 text-green-800',
      '15k': 'bg-blue-100 text-blue-800',
      '10k': 'bg-indigo-100 text-indigo-800',
      '5k': 'bg-purple-100 text-purple-800'
    };
    return colors[distance as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (showWizard) {
    return (
      <RaceWizard 
        onClose={() => setShowWizard(false)}
        onSuccess={() => {
          setShowWizard(false);
          // Refresh data is handled by the hook
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Carreras</h1>
            <p className="text-gray-600">Gestiona las carreras locales que ofreces a tus guests</p>
          </div>
          <Button 
            onClick={() => setShowWizard(true)}
            className="bg-[#1E40AF] hover:bg-[#1E40AF]/90"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Crear Nueva Carrera
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Carreras</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRaces}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reservas Este Año</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bookingsThisYear}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center">
                {stats.averageRating}
                <Star className="w-4 h-4 ml-1 text-yellow-500 fill-current" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <RaceFiltersComponent filters={filters} onFiltersChange={setFilters} />

        {/* Races Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1E40AF] mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando carreras...</p>
          </div>
        ) : races.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No tienes carreras creadas
            </h3>
            <p className="text-gray-600 mb-6">
              Crea tu primera carrera y comienza a compartir experiencias únicas con runners de todo el mundo
            </p>
            <Button 
              onClick={() => setShowWizard(true)}
              className="bg-[#1E40AF] hover:bg-[#1E40AF]/90"
            >
              <Plus className="w-5 h-5 mr-2" />
              Crear Primera Carrera
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {races.map((race) => (
              <Card key={race.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg line-clamp-2">{race.name}</CardTitle>
                    <Badge variant={race.is_active ? "default" : "secondary"}>
                      {race.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(race.race_date)}
                  </div>
                  {race.start_location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      {race.start_location}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent>
                  {/* Modalities */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {race.modalities?.map((modality) => (
                      <Badge key={modality} className={getModalityBadgeColor(modality)}>
                        {modality === 'road' ? 'Ruta/Asfalto' : 'Trail/Montaña'}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Distances */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {race.distances?.slice(0, 3).map((distance) => (
                      <Badge key={distance} className={getDistanceBadgeColor(distance)}>
                        {distance.replace('_', ' ').toUpperCase()}
                      </Badge>
                    ))}
                    {race.distances && race.distances.length > 3 && (
                      <Badge className="bg-gray-100 text-gray-800">
                        +{race.distances.length - 3} más
                      </Badge>
                    )}
                  </div>
                  
                  {/* Stats */}
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {race.total_bookings} reservas
                    </div>
                    {race.average_rating && race.average_rating > 0 && (
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1 text-yellow-500 fill-current" />
                        {race.average_rating}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Races;
