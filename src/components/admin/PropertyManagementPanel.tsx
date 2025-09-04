import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Home, CheckCircle, XCircle, Clock, Trash2, AlertTriangle, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { AdminPropertyService } from "@/services/adminPropertyService";
import { AdminStorageService } from "@/services/adminStorageService";

interface Property {
  id: string;
  title: string;
  description: string | null;
  locality: string;
  full_address: string;
  provinces: string[];
  latitude: number | null;
  longitude: number | null;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  max_guests: number;
  amenities: string[];
  house_rules: string | null;
  check_in_instructions: string | null;
  runner_instructions: string | null;
  cancellation_policy: string | null;
  created_at: string;
  is_active: boolean;
  owner_profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

interface DeleteModal {
  isOpen: boolean;
  property: Property | null;
}

interface ViewModal {
  isOpen: boolean;
  property: Property | null;
}

interface PropertyImage {
  id: string;
  url: string | null;
  caption?: string;
  is_main?: boolean;
  error?: string;
}

const PropertyManagementPanel = () => {
  const { user: currentUser } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<{ [key: string]: string }>({});
  const [deleteModal, setDeleteModal] = useState<DeleteModal>({ isOpen: false, property: null });
  const [viewModal, setViewModal] = useState<ViewModal>({ isOpen: false, property: null });
  const [deletionReason, setDeletionReason] = useState("");
  // Track rejected properties locally since database only has is_active boolean
  const [rejectedProperties, setRejectedProperties] = useState<Set<string>>(new Set());
  // Property images state
  const [propertyImages, setPropertyImages] = useState<PropertyImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  const fetchProperties = async () => {
    try {
      console.log('PropertyManagementPanel: Fetching all properties...');
      
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id, title, description, locality, full_address, provinces, 
          latitude, longitude, bedrooms, beds, bathrooms, max_guests, 
          amenities, house_rules, check_in_instructions, runner_instructions, 
          cancellation_policy, created_at, is_active,
          owner_profile:profiles!properties_owner_id_profiles_fkey (
            first_name, last_name, email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('PropertyManagementPanel: Error fetching properties:', error);
        toast.error('Error al cargar propiedades');
        setProperties([]);
        return;
      }
      
      console.log('PropertyManagementPanel: Fetched properties:', data?.length || 0);
      setProperties(data || []);
    } catch (error) {
      console.error('PropertyManagementPanel: Error fetching properties:', error);
      toast.error('Error al cargar propiedades');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const updatePropertyStatus = async (propertyId: string, status: 'approved' | 'rejected', notes?: string) => {
    if (!currentUser?.id) {
      toast.error('No se pudo identificar el administrador');
      return;
    }

    setProcessingId(propertyId);
    
    try {
      console.log('Starting property status update with AdminPropertyService:', { propertyId, status, adminId: currentUser.id, notes });
      
      // Use the AdminPropertyService that handles service role and RLS bypass
      const result = await AdminPropertyService.updatePropertyStatus(
        propertyId,
        status,
        currentUser.id,
        notes
      );

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido al actualizar propiedad');
      }

      console.log('Property status updated successfully using AdminPropertyService');
      
      toast.success(
        status === 'approved' 
          ? `Propiedad "${result.propertyName}" aprobada exitosamente` 
          : `Propiedad "${result.propertyName}" rechazada`
      );
      
      // Update local state for real-time UI updates (no refresh needed)
      setProperties(prev => 
        prev.map(property => 
          property.id === propertyId 
            ? { ...property, is_active: status === 'approved' }
            : property
        )
      );
      
      // Track rejected properties locally
      if (status === 'rejected') {
        setRejectedProperties(prev => new Set([...prev, propertyId]));
      } else if (status === 'approved') {
        setRejectedProperties(prev => {
          const newSet = new Set([...prev]);
          newSet.delete(propertyId);
          return newSet;
        });
      }
      
      // Clear rejection notes for this property
      setRejectionNotes(prev => ({ ...prev, [propertyId]: '' }));
      
    } catch (error: any) {
      console.error('Error updating property status:', error);
      toast.error(error.message || 'Error al actualizar el estado de la propiedad');
    } finally {
      setProcessingId(null);
    }
  };

  const deleteProperty = async (propertyId: string) => {
    if (!currentUser?.id) {
      toast.error('No se pudo identificar el administrador');
      return;
    }

    setProcessingId(propertyId);
    
    try {
      console.log('Starting property deletion with AdminPropertyService:', { propertyId, adminId: currentUser.id, reason: deletionReason });
      
      // Use the AdminPropertyService that handles service role and RLS bypass
      const result = await AdminPropertyService.deleteProperty(
        propertyId,
        currentUser.id,
        deletionReason.trim() || undefined
      );

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido al eliminar propiedad');
      }

      console.log('Property deleted successfully using AdminPropertyService');
      
      toast.success(`Propiedad "${result.propertyName}" eliminada exitosamente`);
      
      // Update local state for real-time UI updates (no refresh needed)
      setProperties(prev => prev.filter(property => property.id !== propertyId));
      
      // Clean up rejected properties set
      setRejectedProperties(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(propertyId);
        return newSet;
      });
      
      closeDeleteModal();
      
    } catch (error: any) {
      console.error('Error deleting property:', error);
      toast.error(error.message || 'Error al eliminar la propiedad');
    } finally {
      setProcessingId(null);
    }
  };

  const openDeleteModal = (property: Property) => {
    setDeleteModal({ isOpen: true, property });
    setDeletionReason("");
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, property: null });
    setDeletionReason("");
    setProcessingId(null);
  };

  const handleDeleteModalChange = (open: boolean) => {
    if (!open && !processingId) {
      closeDeleteModal();
    }
  };

  const fetchPropertyImages = async (propertyId: string) => {
    setImagesLoading(true);
    try {
      console.log('Fetching property images for:', propertyId);
      const images = await AdminStorageService.getPropertyImageUrls(propertyId);
      console.log('Property images fetched:', images);
      setPropertyImages(images);
    } catch (error) {
      console.error('Error fetching property images:', error);
      setPropertyImages([{
        id: 'error',
        url: null,
        error: 'Error al cargar las imágenes'
      }]);
    } finally {
      setImagesLoading(false);
    }
  };

  const openViewModal = (property: Property) => {
    setViewModal({ isOpen: true, property });
    setPropertyImages([]); // Clear previous images
    fetchPropertyImages(property.id); // Fetch images for this property
  };

  const closeViewModal = () => {
    setViewModal({ isOpen: false, property: null });
    setPropertyImages([]); // Clear images when modal closes
    setImagesLoading(false);
  };

  const handleViewModalChange = (open: boolean) => {
    if (!open) {
      closeViewModal();
    }
  };

  const getStatusBadge = (property: Property) => {
    if (property.is_active) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Aprobada</Badge>;
    } else if (rejectedProperties.has(property.id)) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rechazada</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
    }
  };

  const getOwnerDisplayName = (ownerProfile: any) => {
    if (ownerProfile?.first_name && ownerProfile?.last_name) {
      return `${ownerProfile.first_name} ${ownerProfile.last_name}`;
    }
    return ownerProfile?.email || 'Sin nombre';
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingProperties = properties.filter(p => !p.is_active && !rejectedProperties.has(p.id));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Home className="h-6 w-6 text-blue-600" />
            <span>Gestión de Propiedades</span>
            <Badge variant="secondary">{pendingProperties.length} pendientes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay propiedades registradas
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Propietario</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={`property-${property.id}-${property.is_active}-${rejectedProperties.has(property.id)}`}>
                    <TableCell>
                      <div className="font-medium">{property.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {property.description || 'Sin descripción'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getOwnerDisplayName(property.owner_profile)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {property.owner_profile?.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{property.locality}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {property.full_address}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(property)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(property.created_at), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {/* View Property Button - Always available */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openViewModal(property)}
                          className="w-full"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver Propiedad
                        </Button>
                        
                        {/* Approval/Rejection controls - Only for non-active, non-rejected properties */}
                        {!property.is_active && !rejectedProperties.has(property.id) && (
                          <>
                            <Textarea
                              placeholder="Notas de rechazo (opcional)"
                              value={rejectionNotes[property.id] || ''}
                              onChange={(e) => setRejectionNotes(prev => ({ 
                                ...prev, 
                                [property.id]: e.target.value 
                              }))}
                              className="h-16 text-xs"
                            />
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => updatePropertyStatus(property.id, 'approved')}
                                disabled={processingId === property.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Aprobar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updatePropertyStatus(
                                  property.id, 
                                  'rejected', 
                                  rejectionNotes[property.id]
                                )}
                                disabled={processingId === property.id}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Rechazar
                              </Button>
                            </div>
                          </>
                        )}
                        
                        {/* Status indicators */}
                        {property.is_active && (
                          <div className="text-sm text-green-600 font-medium">
                            ✅ Propiedad Activa
                          </div>
                        )}
                        
                        {rejectedProperties.has(property.id) && (
                          <div className="space-y-2">
                            <div className="text-sm text-red-600 font-medium">
                              ❌ Propiedad Rechazada
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Simply remove from rejected set - no refresh needed
                                setRejectedProperties(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(property.id);
                                  return newSet;
                                });
                              }}
                              disabled={processingId === property.id}
                              className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              🔄 Volver a Pendiente
                            </Button>
                          </div>
                        )}

                        {/* Delete button - available for all properties */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDeleteModal(property)}
                          disabled={processingId === property.id}
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Eliminar Propiedad
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Property Modal */}
      <Dialog open={viewModal.isOpen} onOpenChange={handleViewModalChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Home className="h-5 w-5 text-blue-600" />
              <span>Detalles de la Propiedad</span>
              {viewModal.property && (
                <Badge className={
                  viewModal.property.is_active 
                    ? "bg-green-100 text-green-800" 
                    : rejectedProperties.has(viewModal.property.id)
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                }>
                  {viewModal.property.is_active 
                    ? 'Activa' 
                    : rejectedProperties.has(viewModal.property.id)
                      ? 'Rechazada'
                      : 'Pendiente'
                  }
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {viewModal.property && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Título</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{viewModal.property.title}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Propietario</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    {getOwnerDisplayName(viewModal.property.owner_profile)}
                    <br />
                    <span className="text-xs text-gray-500">{viewModal.property.owner_profile?.email}</span>
                  </p>
                </div>
              </div>

              {/* Description */}
              {viewModal.property.description && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Descripción</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded">{viewModal.property.description}</p>
                </div>
              )}

              {/* Property Images Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center space-x-2">
                  <span>Imágenes de la Propiedad</span>
                  {imagesLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
                </Label>
                <div className="bg-gray-50 p-3 rounded">
                  {imagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Cargando imágenes...</span>
                    </div>
                  ) : propertyImages.length === 0 || (propertyImages.length === 1 && propertyImages[0].id === 'no-images') ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">No Photos Uploaded for this property</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {propertyImages.map((image) => (
                          <div key={image.id} className="relative">
                            {image.url ? (
                              <div className="space-y-2">
                                <div className="relative group">
                                  <img 
                                    src={image.url} 
                                    alt={image.caption || 'Imagen de la propiedad'}
                                    className="w-full h-48 object-cover rounded-lg border"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                                    }}
                                  />
                                  {image.is_main && (
                                    <div className="absolute top-2 left-2">
                                      <Badge className="bg-blue-600 text-white text-xs">
                                        Imagen Principal
                                      </Badge>
                                    </div>
                                  )}
                                  {/* Overlay for better accessibility */}
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-opacity"></div>
                                </div>
                                {image.caption && (
                                  <p className="text-xs text-gray-600 text-center">{image.caption}</p>
                                )}
                              </div>
                            ) : (
                              <div className="w-full h-48 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center">
                                <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
                                <p className="text-xs text-red-600 text-center px-2">
                                  {image.error || 'Error al cargar imagen'}
                                </p>
                                {image.caption && (
                                  <p className="text-xs text-gray-500 text-center px-2 mt-1">{image.caption}</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {!AdminStorageService.isServiceRoleAvailable() && (
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-yellow-800">⚠️ Acceso Limitado a Imágenes</p>
                              <p className="text-yellow-700 mt-1">
                                Para ver todas las imágenes de las propiedades, configura la variable de entorno 
                                <code className="bg-yellow-100 px-1 rounded">VITE_SUPABASE_SERVICE_ROLE_KEY</code> en tu deploy.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Ubicación</Label>
                <div className="bg-gray-50 p-3 rounded space-y-1">
                  <p className="text-sm font-medium">{viewModal.property.locality}</p>
                  <p className="text-sm text-gray-600">{viewModal.property.full_address}</p>
                  {viewModal.property.provinces && viewModal.property.provinces.length > 0 && (
                    <p className="text-xs text-gray-500">Provincias: {viewModal.property.provinces.join(', ')}</p>
                  )}
                  {viewModal.property.latitude && viewModal.property.longitude && (
                    <p className="text-xs text-gray-500">Coordenadas: {viewModal.property.latitude}, {viewModal.property.longitude}</p>
                  )}
                </div>
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-500">Habitaciones</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded text-center">{viewModal.property.bedrooms}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-500">Camas</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded text-center">{viewModal.property.beds}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-500">Baños</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded text-center">{viewModal.property.bathrooms}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-500">Máx. Huéspedes</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded text-center">{viewModal.property.max_guests}</p>
                </div>
              </div>

              {/* Amenities */}
              {viewModal.property.amenities && viewModal.property.amenities.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Comodidades</Label>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex flex-wrap gap-2">
                      {viewModal.property.amenities.map((amenity, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Rules and Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {viewModal.property.house_rules && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Reglas de la Casa</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap">{viewModal.property.house_rules}</p>
                  </div>
                )}
                {viewModal.property.check_in_instructions && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Instrucciones de Check-in</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap">{viewModal.property.check_in_instructions}</p>
                  </div>
                )}
              </div>

              {/* Runner Instructions */}
              {viewModal.property.runner_instructions && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Instrucciones para Corredores</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap">{viewModal.property.runner_instructions}</p>
                </div>
              )}

              {/* Cancellation Policy */}
              {viewModal.property.cancellation_policy && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Política de Cancelación</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded capitalize">{viewModal.property.cancellation_policy}</p>
                </div>
              )}

              {/* Created Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fecha de Creación</Label>
                <p className="text-sm bg-gray-50 p-2 rounded">
                  {formatDistanceToNow(new Date(viewModal.property.created_at), { 
                    addSuffix: true, 
                    locale: es 
                  })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Property Confirmation Modal */}
      <AlertDialog 
        open={deleteModal.isOpen} 
        onOpenChange={handleDeleteModalChange}
      >
        <AlertDialogContent className="sm:max-w-[500px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              <span>Eliminar Propiedad Permanentemente</span>
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium">{deleteModal.property?.title}</p>
                  <p className="text-sm text-muted-foreground">{deleteModal.property?.locality}</p>
                  <p className="text-sm text-muted-foreground">
                    Propietario: {getOwnerDisplayName(deleteModal.property?.owner_profile)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deletion-reason">Motivo de eliminación</Label>
                  <Textarea
                    id="deletion-reason"
                    placeholder="Explica por qué se elimina esta propiedad (opcional, para registros internos)."
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    rows={2}
                    maxLength={500}
                    disabled={!!processingId}
                  />
                  <p className="text-xs text-muted-foreground">
                    {deletionReason.length}/500 caracteres
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-red-800">⚠️ ADVERTENCIA: Esta acción es IRREVERSIBLE</p>
                      <ul className="mt-1 list-disc list-inside text-red-700 space-y-1">
                        <li>Se eliminará permanentemente la propiedad</li>
                        <li>Se eliminarán todas las imágenes asociadas</li>
                        <li>Se eliminarán todas las reservas asociadas</li>
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
              disabled={!!processingId}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteModal.property && deleteProperty(deleteModal.property.id)}
              disabled={!!processingId}
              className="bg-red-600 hover:bg-red-700"
            >
              {processingId === deleteModal.property?.id ? (
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

export default PropertyManagementPanel;