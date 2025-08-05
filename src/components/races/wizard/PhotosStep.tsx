import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Image, X, Star, Camera } from "lucide-react";
import { RaceFormData } from "@/types/race";

interface PhotoPreview {
  id: string;
  file: File | null; // Allow null for existing images
  url: string;
  caption: string;
  category: string;
  displayOrder: number;
  isExisting?: boolean; // Flag for existing images
}

interface PhotosStepProps {
  formData: Partial<RaceFormData>;
  onUpdate: (data: Partial<RaceFormData>) => void;
  photos: PhotoPreview[];
  setPhotos: (photos: PhotoPreview[]) => void;
  removedExistingPhotoIds: string[];
  setRemovedExistingPhotoIds: (ids: string[]) => void;
}

export const PhotosStep = ({ formData, onUpdate, photos, setPhotos, removedExistingPhotoIds, setRemovedExistingPhotoIds }: PhotosStepProps) => {
  const coverInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { value: 'route', label: 'Fotos del recorrido', description: 'Imágenes del trazado y puntos destacados de la ruta' },
    { value: 'elevation', label: 'Perfil de Elevación', description: 'Gráficos o fotos de desniveles' },
    { value: 'landscape', label: 'Paisajes destacados', description: 'Vistas panorámicas y puntos destacados de la ruta' },
    { value: 'finish', label: 'Meta y Llegada', description: 'Área de meta y celebración' },
    { value: 'atmosphere', label: 'Ambiente', description: 'Espíritu y ambiente de la carrera' }
  ];

  // Load existing photos if editing
  useEffect(() => {
    // This would load existing photos from the race data when editing
    // For now, we'll leave it empty as the race data structure needs to be updated
  }, []);

  const handleCoverImageSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    // Remove any existing cover image (both new and existing)
    setPhotos(prev => {
      const oldCover = prev.find(photo => photo.category === 'cover');
      if (oldCover && oldCover.url.startsWith('blob:')) {
        URL.revokeObjectURL(oldCover.url);
      }
      return prev.filter(photo => photo.category !== 'cover');
    });

    const coverPhoto: PhotoPreview = {
      id: `cover-${Date.now()}`,
      file,
      url: URL.createObjectURL(file),
      caption: "Foto principal de la carrera",
      category: 'cover',
      displayOrder: 0,
      isExisting: false
    };

    setPhotos(prev => [coverPhoto, ...prev]);
    console.log('New cover image selected, replaced existing cover');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        const newPhoto: PhotoPreview = {
          id: `${Date.now()}-${Math.random()}`,
          file,
          url,
          category,
          caption: '',
          displayOrder: photos.length,
          isExisting: false
        };
        setPhotos(prev => [...prev, newPhoto]);
      }
    });
  };

  const removeImage = (id: string) => {
    const photoToRemove = photos.find(p => p.id === id);
    
    if (photoToRemove) {
      // Track removed existing photos for deletion from database
      if (photoToRemove.isExisting) {
        const originalId = photoToRemove.id.replace('existing-', '');
        setRemovedExistingPhotoIds(prev => [...prev, originalId]);
        console.log('Marked existing photo for removal:', originalId);
      } else if (photoToRemove.url.startsWith('blob:')) {
        // Only revoke blob URLs for new images
        URL.revokeObjectURL(photoToRemove.url);
      }
    }
    
    setPhotos(prev => prev.filter(photo => photo.id !== id));
    console.log('Removed photo from UI:', id, 'isExisting:', photoToRemove?.isExisting);
  };

  const updateCaption = (id: string, caption: string) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === id ? { ...photo, caption } : photo
    ));
  };

  const coverPhoto = photos.find(photo => photo.category === 'cover');

  return (
    <div className="space-y-8">
      {/* Race Cover Photo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="h-5 w-5 mr-2 text-yellow-500" />
            Foto Principal de la Carrera
            <span className="text-red-500 ml-1">*</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            <span className="text-red-600 font-medium">Requerida:</span> Esta será la imagen que se mostrará en las tarjetas de carrera y como imagen principal
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {coverPhoto ? (
            <div className="relative border rounded-lg overflow-hidden">
              <div className="aspect-video relative">
                {/* Visual indicator for existing cover image */}
                {coverPhoto.isExisting && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded z-10">
                    Imagen Existente
                  </div>
                )}
                <img
                  src={coverPhoto.url}
                  alt="Foto principal de la carrera"
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  Principal
                </div>

                <div className="absolute top-2 right-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(coverPhoto.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="p-3">
                <Label htmlFor={`caption-${coverPhoto.id}`} className="text-xs text-gray-600">
                  Descripción (opcional)
                </Label>
                <Input
                  id={`caption-${coverPhoto.id}`}
                  value={coverPhoto.caption}
                  onChange={(e) => updateCaption(coverPhoto.id, e.target.value)}
                  placeholder="Ej: Vista panorámica del recorrido, Inicio de la carrera..."
                  className="mt-1 text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecciona la foto principal *
              </h3>
              <p className="text-gray-600 mb-4">
                <span className="text-red-600 font-medium">Campo requerido:</span> Esta imagen representará tu carrera en todas las búsquedas y tarjetas
              </p>
              <Button
                variant="outline"
                onClick={() => coverInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Seleccionar Foto Principal
              </Button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleCoverImageSelect(e.target.files)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Photos by Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Image className="h-5 w-5 mr-2" />
            Fotos Adicionales y Documentación
          </CardTitle>
          <p className="text-sm text-gray-600">
            Sube fotos que muestren diferentes aspectos de la experiencia completa de la carrera (opcional)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.map((category) => (
            <div key={category.value} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium">{category.label}</h4>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
                <div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, category.value)}
                    className="hidden"
                    id={`upload-${category.value}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById(`upload-${category.value}`)?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Fotos
                  </Button>
                </div>
              </div>

              {/* Show uploaded images for this category */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos
                  .filter(img => img.category === category.value)
                  .map((image, index) => (
                    <div key={image.id} className="relative group">
                      {/* Visual indicator for existing images */}
                      {image.isExisting && (
                        <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded z-10">
                          Existente
                        </div>
                      )}
                      <img
                        src={image.url}
                        alt={image.caption || 'Preview'}
                        className="w-full h-32 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <Input
                        placeholder="Caption opcional..."
                        value={image.caption}
                        onChange={(e) => updateCaption(image.id, e.target.value)}
                        className="mt-2 text-xs"
                      />
                    </div>
                  ))}
              </div>
            </div>
          ))}

          {/* Show message when no additional photos */}
          {photos.filter(p => p.category !== 'cover').length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Las fotos ayudan a los guests a visualizar la experiencia
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Puedes subir fotos más tarde desde la gestión de carreras
              </p>
            </div>
          )}

          {/* Tips */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">📸 Tips para Mejores Fotos</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• <strong>Foto principal:</strong> Elige una imagen que capture la esencia de tu carrera</li>
              <li>• <strong>Recorrido:</strong> Incluye fotos de diferentes puntos del trazado</li>
              <li>• <strong>Paisajes:</strong> Muestra las vistas más espectaculares</li>
              <li>• <strong>Ambiente:</strong> Captura la emoción y el espíritu de la carrera</li>
              <li>• <strong>Elevación:</strong> Añade gráficos o fotos de los desniveles</li>
              <li>• <strong>Captions:</strong> Añade descripciones para contextualizar cada foto</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
