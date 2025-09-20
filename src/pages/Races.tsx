import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trophy, MapPin, Calendar, Users, Edit, Camera } from "lucide-react";
import { useState, useEffect } from "react";
import { RaceWizard } from "@/components/races/RaceWizard";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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

const Races = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    if (user) {
      fetchMyRaces();
    }
  }, [user]);

  const fetchMyRaces = async () => {
    if (!user) return;
    
    try {
      console.log('Races.tsx: Starting fetchMyRaces');
      const { data, error } = await supabase
        .from('active_races')
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

      console.log('Races.tsx: Raw database data:', data?.length, 'races');
      
      // Convert all races using the proper conversion function
      const convertedRaces = (data || []).map(race => {
        console.log('🔄 Races.tsx: Converting race:', race.name, 'Raw distances:', race.distances, 'Raw modalities:', race.modalities);
        const converted = convertDatabaseRace(race);
        console.log('✅ Races.tsx: Converted race:', race.name, 'Parsed distances:', converted.distances, 'Parsed modalities:', converted.modalities);
        return converted;
      });
      
      console.log('Races.tsx: Fetched races:', convertedRaces.length, 'races');
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
    console.log('✅ Races.tsx: handleRaceSuccess called with data:', updatedRaceData);
    const wasEditing = editingRace !== null;
    
    if (wasEditing && editingRace && updatedRaceData) {
      console.log('🔄 Races.tsx: Race was edited, updating state immediately with provided data');
      console.log('🎯 Races.tsx: Updated race distances:', updatedRaceData.distances);
      console.log('🎯 Races.tsx: Updated race modalities:', updatedRaceData.modalities);
      console.log('🎯 Races.tsx: Updated race max_guests:', updatedRaceData.max_guests);
      console.log('🎯 Races.tsx: Updated race race_date:', updatedRaceData.race_date);
      console.log('🎯 Races.tsx: Updated race name:', updatedRaceData.name);
      
      // Update the local state immediately with the provided updated race data
      setRaces(prevRaces => {
        const newRaces = prevRaces.map(race => {
          if (race.id === editingRace.id) {
            console.log('🔄 Races.tsx: Replacing race in state. Old race:');
            console.log('  - Old max_guests:', race.max_guests);
            console.log('  - Old race_date:', race.race_date);
            console.log('  - Old distances:', race.distances);
            console.log('  - Old images count:', race.images?.length || 0);
            
            console.log('🔄 Races.tsx: Replacing race in state. New race:');
            console.log('  - New max_guests:', updatedRaceData.max_guests);
            console.log('  - New race_date:', updatedRaceData.race_date);
            console.log('  - New distances:', updatedRaceData.distances);
            console.log('  - New images count:', updatedRaceData.images?.length || 0);
            
            const mergedRace = { 
              ...updatedRaceData,
              // Use images from updatedRaceData if available, otherwise preserve existing
              images: updatedRaceData.images || race.images,
              id: race.id // Ensure ID is preserved
            };
            
            console.log('✅ Races.tsx: Final merged race:');
            console.log('  - Final max_guests:', mergedRace.max_guests);
            console.log('  - Final race_date:', mergedRace.race_date);
            console.log('  - Final distances:', mergedRace.distances);
            console.log('  - Final images count:', mergedRace.images?.length || 0);
            console.log('  - Final cover image URL:', mergedRace.images?.find(img => img.category === 'cover')?.image_url?.substring(0, 50));
            
            return mergedRace;
          }
          return race;
        });
        console.log('✅ Races.tsx: State updated with new races array');
        return newRaces;
      });
      
      // Immediate refetch to get the absolute latest data
      fetchMyRaces();
    } else {
      console.log('🆕 Races.tsx: New race created or no updated data provided, refetching');
      // For new races or when no updated data is provided, refetch
      setTimeout(() => {
        fetchMyRaces();
      }, 500);
    }
    
    setShowWizard(false);
    setEditingRace(null);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
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

        {races.length === 0 ? (
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
            {races.map((race) => {
              // Debug race data before rendering
              console.log('🃏 Races.tsx: Rendering race card for:', race.name);
              console.log('  - Rendering max_guests:', race.max_guests);
              console.log('  - Rendering race_date:', race.race_date);
              console.log('  - Rendering distances:', race.distances);
              console.log('  - Rendering modalities:', race.modalities);
              
              return (
              <Card 
                key={`${race.id}-${race.max_guests}-${race.race_date}-${JSON.stringify(race.distances)}-${JSON.stringify(race.modalities)}-${race.images?.length || 0}`} 
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                  {/* Race Image or Fallback */}
                  {race.images && race.images.length > 0 ? (() => {
                    // Find main image: first by 'cover' category, then by lowest display_order
                    const coverImage = race.images.find(img => img.category === 'cover');
                    const mainImage = coverImage || [...race.images].sort((a, b) => a.display_order - b.display_order)[0];
                    console.log('🇼 Races.tsx: Rendering image for race', race.name, '- Cover found:', !!coverImage, '- Main image URL:', mainImage?.image_url?.substring(0, 50));
                    return (
                      <img
                        src={mainImage?.image_url}
                        alt={race.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to gradient background if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    );
                  })() : null}
                  
                  {/* Fallback gradient background */}
                  <div className={`absolute inset-0 flex items-center justify-center ${race.images && race.images.length > 0 ? 'hidden' : ''}`}>
                    <Trophy className="h-12 w-12 text-white" />
                  </div>
                  
                  {/* Status Badge */}
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
                      {(() => {
                        const dateValue = format(new Date(race.race_date), "d 'de' MMMM, yyyy", { locale: es });
                        console.log('📅 Races.tsx: Rendering date for', race.name, '- Raw race_date:', race.race_date, '- Formatted:', dateValue);
                        return dateValue;
                      })()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      {race.province || 'Ubicación por definir'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Race Characteristics */}
                  <div className="space-y-3 mb-4">
                    {/* Modalities */}
                    {race.modalities && race.modalities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {race.modalities.map((modality) => (
                          <Badge key={modality} className={`${modality === 'road' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {modality === 'road' ? 'Ruta/Asfalto' : 'Trail/Montaña'}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Distances */}
                    {race.distances && race.distances.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {race.distances.slice(0, 3).map((distance) => {
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
                            <Badge key={distance} className="bg-purple-100 text-purple-800">
                              {labels[distance as keyof typeof labels] || distance.toUpperCase()}
                            </Badge>
                          );
                        })}
                        {race.distances.length > 3 && (
                          <Badge className="bg-gray-100 text-gray-800">
                            +{race.distances.length - 3} más
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {(() => {
                          const guestValue = `${race.max_guests} runners max`;
                          console.log('👥 Races.tsx: Rendering max_guests for', race.name, '- Raw max_guests:', race.max_guests, '- Formatted:', guestValue);
                          return guestValue;
                        })()}
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
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditRace(race)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
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
    </ProtectedRoute>
  );
};

export default Races;