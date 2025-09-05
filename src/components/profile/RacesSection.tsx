import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Trophy, Plus, Edit, Camera } from "lucide-react";
import UserAccessGuard from "@/components/guards/UserAccessGuard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RaceWizard } from "@/components/races/RaceWizard";
import { PhotoGalleryModal } from "@/components/common/PhotoGalleryModal";
import type { RaceModality, RaceDistance } from "@/types/race";

interface Race {
  id: string;
  name: string;
  description: string;
  race_date: string;
  registration_deadline?: string;
  province: string;
  property_id: string;
  modalities: RaceModality[];
  terrain_profile: any;
  distances: RaceDistance[];
  has_wave_starts: boolean;
  distance_from_property?: number;
  official_website?: string;
  registration_cost?: number;
  max_guests: number;
  points_cost: number;
  is_active: boolean;
  total_bookings: number;
  average_rating: number;
  highlights?: string;
  local_tips?: string;
  weather_notes?: string;
  images?: {
    id: string;
    image_url: string;
    caption?: string;
    category: string;
    display_order: number;
  }[];
}

const RacesSection = () => {
  const { user } = useAuth();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editingRace, setEditingRace] = useState<Race | null>(null);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [selectedRacePhotos, setSelectedRacePhotos] = useState<any[]>([]);
  const [selectedRaceTitle, setSelectedRaceTitle] = useState("");

  // Helper function to safely parse JSON fields
  const parseJsonField = (field: any): any[] => {
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    if (field && typeof field === 'object') {
      return Array.isArray(field) ? field : [];
    }
    return [];
  };

  // Convert database race to typed Race
  const convertDatabaseRace = (dbRace: any): Race => {
    return {
      ...dbRace,
      modalities: parseJsonField(dbRace.modalities) as RaceModality[],
      distances: parseJsonField(dbRace.distances) as RaceDistance[]
    };
  };

  // Debug races state changes
  useEffect(() => {
    console.log('🏁 RacesSection: Races state changed. Count:', races?.length || 0);
    if (races && races.length > 0) {
      console.log('🏁 RacesSection: Sample race data:', {
        id: races[0].id,
        name: races[0].name,
        race_date: races[0].race_date,
        max_guests: races[0].max_guests,
        distances: races[0].distances,
        modalities: races[0].modalities
      });
    }
  }, [races]);

  useEffect(() => {
    if (user) {
      fetchMyRaces();
    }
  }, [user]);

  const fetchMyRaces = async () => {
    if (!user) return;
    
    try {
      console.log('RacesSection: Starting fetchMyRaces');
      const { data, error } = await supabase
        .from('races')
        .select(`
          *,
          images:race_images(
            id,
            image_url,
            caption,
            category,
            display_order
          )
        `)
        .eq('host_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user races:', error);
        toast.error('Error al cargar tus carreras');
        return;
      }

      console.log('RacesSection: Raw database data:', data?.length, 'races');
      
      // Convert all races using the proper conversion function
      const convertedRaces = (data || []).map(race => {
        console.log('🔄 RacesSection: Converting race:', race.name, 'Raw distances:', race.distances, 'Raw modalities:', race.modalities);
        const converted = convertDatabaseRace(race);
        console.log('✅ RacesSection: Converted race:', race.name, 'Parsed distances:', converted.distances, 'Parsed modalities:', converted.modalities);
        return converted;
      });
      
      console.log('RacesSection: Fetched races:', convertedRaces.length, 'races');
      setRaces(convertedRaces);
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

  const handleViewPhotos = (race: Race) => {
    console.log('📷 Opening photo gallery for race:', race.name, 'with', race.images?.length || 0, 'images');
    if (race.images && race.images.length > 0) {
      setSelectedRacePhotos(race.images);
      setSelectedRaceTitle(race.name);
      setShowPhotoGallery(true);
    } else {
      toast.info('Esta carrera no tiene fotos aún');
    }
  };



  const handleRaceSuccess = (updatedRaceData?: any) => {
    console.log('✅ RacesSection: handleRaceSuccess called with data:', updatedRaceData);
    const wasEditing = editingRace !== null;
    
    if (wasEditing && editingRace && updatedRaceData) {
      console.log('🔄 RacesSection: Race was edited, updating state immediately with provided data');
      console.log('🎯 RacesSection: Updated race distances:', updatedRaceData.distances);
      console.log('🎯 RacesSection: Updated race modalities:', updatedRaceData.modalities);
      console.log('🎯 RacesSection: Updated race max_guests:', updatedRaceData.max_guests);
      console.log('🎯 RacesSection: Updated race race_date:', updatedRaceData.race_date);
      console.log('🎯 RacesSection: Updated race name:', updatedRaceData.name);
      
      // Update the local state immediately with the provided updated race data
      setRaces(prevRaces => {
        const newRaces = prevRaces.map(race => {
          if (race.id === editingRace.id) {
            console.log('🔄 RacesSection: Replacing race in state. Old race:');
            console.log('  - Old max_guests:', race.max_guests);
            console.log('  - Old race_date:', race.race_date);
            console.log('  - Old distances:', race.distances);
            
            console.log('🔄 RacesSection: Replacing race in state. New race:');
            console.log('  - New max_guests:', updatedRaceData.max_guests);
            console.log('  - New race_date:', updatedRaceData.race_date);
            console.log('  - New distances:', updatedRaceData.distances);
            
            const mergedRace = { 
              ...updatedRaceData,
              // Use images from updatedRaceData if available, otherwise preserve existing
              images: updatedRaceData.images || race.images,
              id: race.id // Ensure ID is preserved
            };
            
            console.log('✅ RacesSection: Final merged race:', mergedRace);
            console.log('  - Final max_guests:', mergedRace.max_guests);
            console.log('  - Final race_date:', mergedRace.race_date);
            console.log('  - Final distances:', mergedRace.distances);
            
            return mergedRace;
          }
          return race;
        });
        console.log('✅ RacesSection: State updated with new races array');
        return newRaces;
      });
      
      // Immediate refetch to get the absolute latest data
      fetchMyRaces();
    } else {
      console.log('🆕 RacesSection: New race created or no updated data provided, refetching');
      // For new races or when no updated data is provided, refetch
      setTimeout(() => {
        fetchMyRaces();
      }, 500);
    }
    
    setShowWizard(false);
    setEditingRace(null);
  };

  const formatDistances = (distances: RaceDistance[]) => {
    if (!distances || !Array.isArray(distances) || distances.length === 0) {
      return 'No especificada';
    }
    
    const labels = {
      'ultra': 'ULTRA',
      'marathon': 'MARATÓN',
      'half_marathon': 'MEDIA MARATÓN',
      '20k': '20K',
      '15k': '15K',
      '10k': '10K',
      '5k': '5K'
    };
    
    return distances.map(distance => 
      labels[distance as keyof typeof labels] || distance.toUpperCase()
    ).join(', ');
  };
  
  const formatModalities = (modalities: RaceModality[]) => {
    if (!modalities || !Array.isArray(modalities) || modalities.length === 0) {
      return 'No especificada';
    }
    
    return modalities.map(modality => 
      modality === 'road' ? 'Ruta/Asfalto' : 'Trail/Montaña'
    ).join(', ');
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
        <UserAccessGuard showCreateRestriction={true}>
          <Button onClick={handleCreateRace} className="bg-runner-blue-600 hover:bg-runner-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Carrera
          </Button>
        </UserAccessGuard>
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
            <UserAccessGuard showCreateRestriction={true}>
              <Button onClick={handleCreateRace} className="bg-runner-blue-600 hover:bg-runner-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Crear Mi Primera Carrera
              </Button>
            </UserAccessGuard>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {races.map((race) => {
            // Debug race data before rendering
            console.log('🃏 RacesSection: Rendering race card for:', race.name);
            console.log('  - Rendering max_guests:', race.max_guests);
            console.log('  - Rendering race_date:', race.race_date);
            console.log('  - Rendering distances:', race.distances);
            
            return (
            <Card key={`${race.id}-${race.max_guests}-${race.race_date}-${JSON.stringify(race.distances)}-${race.images?.length || 0}`} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{race.name}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {(() => {
                          const dateValue = new Date(race.race_date).toLocaleDateString('es-ES');
                          console.log('📅 RacesSection: Rendering date for', race.name, '- Raw race_date:', race.race_date, '- Formatted:', dateValue);
                          return dateValue;
                        })()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {getStatusBadge(race)}
                    {race.images && race.images.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewPhotos(race)}
                        className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 flex items-center gap-1"
                        title="Ver fotos de la carrera"
                      >
                        <Camera className="h-4 w-4" />
                        <span className="text-xs">Ver Fotos</span>
                        <span className="text-xs bg-green-200 text-green-800 px-1 rounded">
                          {race.images.length}
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Race Characteristics - Modalities and Distances as Badges */}
                  <div className="space-y-2">
                    {/* Modalities */}
                    {race.modalities && race.modalities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {race.modalities.map((modality, index) => (
                          <Badge key={index} className={`${modality === 'road' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {modality === 'road' ? 'Ruta/Asfalto' : 'Trail/Montaña'}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Distances */}
                    {race.distances && race.distances.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {race.distances.slice(0, 4).map((distance, index) => {
                          const labels = {
                            'ultra': 'ULTRA',
                            'marathon': 'MARATÓN', 
                            'half_marathon': 'MEDIA MARATÓN',
                            '20k': '20K',
                            '15k': '15K',
                            '10k': '10K',
                            '5k': '5K'
                          };
                          return (
                            <Badge key={index} className="bg-purple-100 text-purple-800">
                              {labels[distance as keyof typeof labels] || distance.toUpperCase()}
                            </Badge>
                          );
                        })}
                        {race.distances.length > 4 && (
                          <Badge className="bg-gray-100 text-gray-800">
                            +{race.distances.length - 4} más
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">{race.province || 'Ubicación por definir'}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      {(() => {
                        const guestValue = `${race.max_guests} participantes máximo`;
                        console.log('👥 RacesSection: Rendering max_guests for', race.name, '- Raw max_guests:', race.max_guests, '- Formatted:', guestValue);
                        return guestValue;
                      })()}
                    </span>
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
                        title="Editar carrera"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {showWizard && (
        <RaceWizard
          onClose={() => {
            setShowWizard(false);
            setEditingRace(null);
          }}
          onSuccess={handleRaceSuccess}
          editingRace={editingRace}
          isEditMode={editingRace !== null}
        />
      )}

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        key={`${selectedRaceTitle}-${selectedRacePhotos.length}`}
        isOpen={showPhotoGallery}
        onClose={() => setShowPhotoGallery(false)}
        photos={selectedRacePhotos}
        title={`Fotos de ${selectedRaceTitle}`}
      />
    </div>
  );
};

export default RacesSection;