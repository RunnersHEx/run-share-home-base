import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { AdminRaceService } from "@/services/adminRaceService";
import { toast } from "sonner";
import { Calendar, MapPin, Users, Trophy, CheckCircle, XCircle, Clock, Trash2, AlertTriangle, ExternalLink, Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

interface Race {
  id: string;
  name: string;
  description: string;
  race_date: string;
  registration_deadline: string | null;
  start_location: string;
  distances: any;
  max_guests: number;
  points_cost: number;
  is_active: boolean;
  created_at: string;
  host_id: string;
  province: string;
  official_website: string | null;
  registration_cost: number | null;
  highlights: string | null;
  local_tips: string | null;
  weather_notes: string | null;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
  properties: {
    id: string;
    title: string;
    locality: string;
    full_address: string;
    provinces: string[];
    latitude: number | null;
    longitude: number | null;
  };
  race_images: RaceImage[];
}

interface RaceImage {
  id: string;
  image_url: string;
  category: string;
  caption: string | null;
  display_order: number;
}

interface DeleteModal {
  isOpen: boolean;
  race: Race | null;
}

const RaceVerificationPanel = () => {
  const { user: currentUser } = useAuth();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});
  const [deleteModal, setDeleteModal] = useState<DeleteModal>({ isOpen: false, race: null });
  const [deletionReason, setDeletionReason] = useState("");
  // Image modal state
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    images: RaceImage[];
    currentIndex: number;
    raceName: string;
  }>({ isOpen: false, images: [], currentIndex: 0, raceName: '' });

  useEffect(() => {
    fetchRaces();
  }, []);

  const fetchRaces = async () => {
    try {
      const data = await AdminRaceService.getAllRaces();
      setRaces(data);
    } catch (error: any) {
      console.error('Exception fetching races:', error);
      toast.error('Error al cargar las carreras');
    } finally {
      setLoading(false);
    }
  };

  const handleRaceAction = async (raceId: string, action: 'approve' | 'reject', notes?: string) => {
    if (!currentUser?.id) {
      toast.error('No se pudo identificar el administrador');
      return;
    }

    setActionLoading(raceId);
    
    try {
      const result = await AdminRaceService.updateRaceStatus(
        raceId,
        currentUser.id,
        action === 'approve',
        notes
      );

      toast.success(
        action === 'approve' 
          ? `Carrera "${result.data.race_name}" aprobada exitosamente` 
          : `Carrera "${result.data.race_name}" desactivada exitosamente`
      );
      
      // Refresh the list
      await fetchRaces();
      
      // Clear admin notes
      setAdminNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[raceId];
        return newNotes;
      });

    } catch (error: any) {
      console.error(`Exception ${action}ing race:`, error);
      toast.error(error.message || `Error al ${action === 'approve' ? 'aprobar' : 'desactivar'} la carrera`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRace = async (raceId: string) => {
    if (!currentUser?.id) {
      toast.error('No se pudo identificar el administrador');
      return;
    }

    setActionLoading(raceId);
    
    try {
      console.log('Attempting to delete race:', raceId, 'by admin:', currentUser.id);
      console.log('Deletion reason:', deletionReason);
      console.log('Admin client available:', AdminRaceService.isAdminClientAvailable());
      
      const result = await AdminRaceService.deleteRace(
        raceId,
        currentUser.id,
        deletionReason.trim() || null
      );

      console.log('Delete result:', result);
      
      toast.success(`Carrera "${result.data.race_name}" eliminada exitosamente`);
      
      // Refresh the list
      await fetchRaces();
      closeDeleteModal();

    } catch (error: any) {
      console.error('Exception deleting race:', error);
      toast.error(error.message || 'Error al eliminar la carrera');
    } finally {
      setActionLoading(null);
    }
  };

  const openDeleteModal = (race: Race) => {
    setDeleteModal({ isOpen: true, race });
    setDeletionReason("");
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, race: null });
    setDeletionReason("");
    setActionLoading(null);
  };

  const handleDeleteModalChange = (open: boolean) => {
    if (!open && !actionLoading) {
      closeDeleteModal();
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

  const getHostDisplayName = (profiles: any) => {
    if (profiles?.first_name && profiles?.last_name) {
      return `${profiles.first_name} ${profiles.last_name}`;
    }
    return profiles?.email || 'Host desconocido';
  };

  const getLocationDisplayText = (race: Race) => {
    const locationParts = [];

    // Only show the race province (this is what matters for point costs)
    if (race.province && race.province.trim()) {
      locationParts.push(`Provincia: ${race.province}`);
    } else {
      // Fallback to property locality if no race province
      if (race.properties?.locality) {
        locationParts.push(race.properties.locality);
      }
    }

    // Add start location if it exists and provides additional context
    if (race.start_location && race.start_location.trim() && race.start_location !== 'unspecified') {
      locationParts.push(`Punto de salida: ${race.start_location}`);
    }

    return locationParts.length > 0 ? locationParts.join(' - ') : 'Ubicación no especificada';
  };

  const openImageModal = (images: RaceImage[], startIndex: number, raceName: string) => {
    setImageModal({
      isOpen: true,
      images,
      currentIndex: startIndex,
      raceName
    });
  };

  const closeImageModal = () => {
    setImageModal({ isOpen: false, images: [], currentIndex: 0, raceName: '' });
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    setImageModal(prev => {
      const newIndex = direction === 'next' 
        ? (prev.currentIndex + 1) % prev.images.length
        : prev.currentIndex === 0 
          ? prev.images.length - 1
          : prev.currentIndex - 1;
      return { ...prev, currentIndex: newIndex };
    });
  };

  // Keyboard navigation for image modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!imageModal.isOpen) return;
      
      if (e.key === 'Escape') {
        closeImageModal();
      } else if (e.key === 'ArrowLeft') {
        navigateImage('prev');
      } else if (e.key === 'ArrowRight') {
        navigateImage('next');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [imageModal.isOpen]);

  const getPropertyInfo = (race: Race) => {
    if (!race.properties) return null;
    
    return {
      title: race.properties.title,
      fullAddress: race.properties.full_address,
      coordinates: race.properties.latitude && race.properties.longitude 
        ? `${race.properties.latitude}, ${race.properties.longitude}` 
        : null
    };
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
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-6 w-6 mr-2" />
              Verificación de Carreras
            </CardTitle>
            <p className="text-gray-600">
              Revisa, aprueba y gestiona las carreras creadas por los hosts
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
                        Host: {getHostDisplayName(race.profiles)} ({race.profiles?.email})
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
                      <h4 className="font-medium mb-2">Ubicación y detalles:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                          <div>
                            <div className="font-medium text-gray-700">
                              {getLocationDisplayText(race)}
                            </div>
                            {getPropertyInfo(race) && (
                              <div className="text-xs text-gray-500 mt-1 space-y-1">
                                <div>Propiedad: {getPropertyInfo(race).title}</div>
                                <div>Dirección: {getPropertyInfo(race).fullAddress}</div>
                                {getPropertyInfo(race).coordinates && (
                                  <div>Coordenadas: {getPropertyInfo(race).coordinates}</div>
                                )}
                              </div>
                            )}
                          </div>
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

                    {/* Registration Details Section */}
                    <div>
                      <h4 className="font-medium mb-2">Información de registro:</h4>
                      <div className="bg-gray-50 p-3 rounded space-y-2">
                        {race.registration_deadline && (
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            <span>
                              <strong>Fecha límite:</strong> {new Date(race.registration_deadline).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        )}
                        {race.registration_cost !== null && (
                          <div className="flex items-center text-sm">
                            <span className="font-medium mr-2">€</span>
                            <span>
                              <strong>Costo de inscripción:</strong> {race.registration_cost > 0 ? `${race.registration_cost}€` : 'Gratuita'}
                            </span>
                          </div>
                        )}
                        {race.official_website && (
                          <div className="flex items-center text-sm">
                            <ExternalLink className="h-4 w-4 mr-2 text-gray-400" />
                            <span>
                              <strong>Sitio web:</strong> 
                              <a 
                                href={race.official_website.startsWith('http') ? race.official_website : `https://${race.official_website}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-1 text-blue-600 hover:text-blue-800 underline"
                              >
                                {race.official_website}
                              </a>
                            </span>
                          </div>
                        )}
                        {!race.registration_deadline && !race.registration_cost && !race.official_website && (
                          <p className="text-sm text-gray-500">Sin información de registro proporcionada</p>
                        )}
                      </div>
                    </div>

                    {/* Race Images Section */}
                    {race.race_images && race.race_images.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center">
                          <Camera className="h-4 w-4 mr-2" />
                          Imágenes de la carrera ({race.race_images.length})
                        </h4>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {race.race_images
                              .sort((a, b) => a.display_order - b.display_order)
                              .map((image, index) => (
                                <div 
                                  key={image.id} 
                                  className="relative group cursor-pointer"
                                  onClick={() => openImageModal(
                                    race.race_images.sort((a, b) => a.display_order - b.display_order), 
                                    index, 
                                    race.name
                                  )}
                                >
                                  <img 
                                    src={image.image_url} 
                                    alt={image.caption || `Imagen de ${race.name}`}
                                    className="w-full h-24 object-cover rounded border transition-transform group-hover:scale-105"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded transition-opacity flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="bg-white bg-opacity-90 rounded-full p-2">
                                        <Camera className="h-4 w-4 text-gray-700" />
                                      </div>
                                    </div>
                                  </div>
                                  {image.category && (
                                    <div className="absolute top-1 left-1">
                                      <span className="bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                                        {image.category}
                                      </span>
                                    </div>
                                  )}
                                  {image.caption && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 rounded-b">
                                      {image.caption}
                                    </div>
                                  )}
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional Race Information */}
                    {(race.highlights || race.local_tips || race.weather_notes) && (
                      <div>
                        <h4 className="font-medium mb-2">Información adicional:</h4>
                        <div className="space-y-3">
                          {race.highlights && (
                            <div className="bg-blue-50 p-3 rounded">
                              <h5 className="text-sm font-medium text-blue-800 mb-1">Destacados:</h5>
                              <p className="text-sm text-blue-700">{race.highlights}</p>
                            </div>
                          )}
                          {race.local_tips && (
                            <div className="bg-green-50 p-3 rounded">
                              <h5 className="text-sm font-medium text-green-800 mb-1">Consejos locales:</h5>
                              <p className="text-sm text-green-700">{race.local_tips}</p>
                            </div>
                          )}
                          {race.weather_notes && (
                            <div className="bg-yellow-50 p-3 rounded">
                              <h5 className="text-sm font-medium text-yellow-800 mb-1">Notas del clima:</h5>
                              <p className="text-sm text-yellow-700">{race.weather_notes}</p>
                            </div>
                          )}
                        </div>
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
                          onClick={() => handleRaceAction(race.id, 'approve', adminNotes[race.id])}
                          disabled={actionLoading === race.id}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {actionLoading === race.id ? 'Procesando...' : 'Aprobar'}
                        </Button>
                      )}
                      
                      {race.is_active && (
                        <Button
                          onClick={() => handleRaceAction(race.id, 'reject', adminNotes[race.id])}
                          disabled={actionLoading === race.id}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {actionLoading === race.id ? 'Procesando...' : 'Desactivar'}
                        </Button>
                      )}

                      <Button
                        onClick={() => openDeleteModal(race)}
                        disabled={actionLoading === race.id}
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
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

      {/* Image Modal */}
      {imageModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation Buttons */}
            {imageModal.images.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Image Display */}
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <div className="relative max-w-full max-h-[80vh] flex items-center justify-center">
                <img
                  src={imageModal.images[imageModal.currentIndex]?.image_url}
                  alt={imageModal.images[imageModal.currentIndex]?.caption || `Imagen de ${imageModal.raceName}`}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>

              {/* Image Info */}
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{imageModal.raceName}</h3>
                  <div className="flex items-center space-x-4">
                    {imageModal.images[imageModal.currentIndex]?.category && (
                      <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded">
                        {imageModal.images[imageModal.currentIndex].category}
                      </span>
                    )}
                    <span className="text-sm text-gray-300">
                      {imageModal.currentIndex + 1} de {imageModal.images.length}
                    </span>
                  </div>
                </div>
                {imageModal.images[imageModal.currentIndex]?.caption && (
                  <p className="text-sm text-gray-200">
                    {imageModal.images[imageModal.currentIndex].caption}
                  </p>
                )}
              </div>

              {/* Thumbnail Navigation */}
              {imageModal.images.length > 1 && (
                <div className="absolute bottom-20 left-4 right-4">
                  <div className="flex justify-center space-x-2 overflow-x-auto">
                    {imageModal.images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setImageModal(prev => ({ ...prev, currentIndex: index }))}
                        className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden ${
                          index === imageModal.currentIndex 
                            ? 'border-white' 
                            : 'border-gray-500 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={image.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Race Confirmation Modal */}
      <AlertDialog 
        open={deleteModal.isOpen} 
        onOpenChange={handleDeleteModalChange}
      >
        <AlertDialogContent className="sm:max-w-[500px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              <span>Eliminar Carrera Permanentemente</span>
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium">{deleteModal.race?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Fecha: {deleteModal.race?.race_date && new Date(deleteModal.race.race_date).toLocaleDateString('es-ES')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Host: {getHostDisplayName(deleteModal.race?.profiles)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deletion-reason">Motivo de eliminación</Label>
                  <Textarea
                    id="deletion-reason"
                    placeholder="Explica por qué se elimina esta carrera. Este mensaje será visible para el host."
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    disabled={!!actionLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    {deletionReason.length}/2000 caracteres
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-red-800">⚠️ ADVERTENCIA: Esta acción es IRREVERSIBLE</p>
                      <ul className="mt-1 list-disc list-inside text-red-700 space-y-1">
                        <li>Se eliminará permanentemente la carrera</li>
                        <li>Se eliminarán todas las imágenes asociadas</li>
                        <li>Se eliminarán todas las reservas asociadas</li>
                        <li>El host recibirá una notificación con el motivo</li>
                        <li>Esta acción NO se puede deshacer</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              disabled={!!actionLoading}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteModal.race && handleDeleteRace(deleteModal.race.id)}
              disabled={!!actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading === deleteModal.race?.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Eliminar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RaceVerificationPanel;