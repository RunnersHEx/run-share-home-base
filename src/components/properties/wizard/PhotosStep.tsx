import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Image, X, Star, Camera } from "lucide-react";
import { PropertyFormData } from "@/types/property";

interface PhotoPreview {
  id: string;
  file: File;
  url: string;
  caption: string;
  isMain: boolean;
}

interface PhotosStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
  photos: PhotoPreview[];
  setPhotos: (photos: PhotoPreview[]) => void;
}

const PhotosStep = ({ formData, updateFormData, photos, setPhotos }: PhotosStepProps) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newPhotos: PhotoPreview[] = [];
    
    Array.from(files).forEach((file, index) => {
      if (file.type.startsWith('image/') && photos.length + newPhotos.length < 20) {
        const preview: PhotoPreview = {
          id: `${Date.now()}-${index}`,
          file,
          url: URL.createObjectURL(file),
          caption: "",
          isMain: photos.length === 0 && index === 0 // First photo is main by default
        };
        newPhotos.push(preview);
      }
    });

    setPhotos([...photos, ...newPhotos]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removePhoto = (id: string) => {
    const updated = photos.filter(photo => photo.id !== id);
    
    // If we removed the main photo, make the first remaining photo main
    if (updated.length > 0 && !updated.some(p => p.isMain)) {
      updated[0].isMain = true;
    }
    
    setPhotos(updated);
  };

  const setMainPhoto = (id: string) => {
    setPhotos(photos.map(photo => ({
      ...photo,
      isMain: photo.id === id
    })));
  };

  const updateCaption = (id: string, caption: string) => {
    setPhotos(photos.map(photo => 
      photo.id === id ? { ...photo, caption } : photo
    ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Fotos de tu Propiedad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? "border-runner-blue-500 bg-runner-blue-50" 
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Arrastra y suelta tus fotos aquí
            </h3>
            <p className="text-gray-600 mb-2">
              O haz clic para seleccionar archivos (máximo 20 fotos)
            </p>
            <p className="text-sm text-runner-blue-600 font-medium mb-4">
              Opcional. Pero RECUERDA, sube fotos de tus espacios y atrae a más runners a tu casa
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={photos.length >= 20}
            >
              <Upload className="h-4 w-4 mr-2" />
              Seleccionar Fotos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>

          {/* Photos Preview Grid */}
          {photos.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">
                Fotos Seleccionadas ({photos.length}/20)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div key={photo.id} className="relative border rounded-lg overflow-hidden">
                    <div className="aspect-video relative">
                      <img
                        src={photo.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Main Photo Badge */}
                      {photo.isMain && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                          <Star className="h-3 w-3 mr-1" />
                          Principal
                        </div>
                      )}

                      {/* Actions */}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {!photo.isMain && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setMainPhoto(photo.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Star className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removePhoto(photo.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Caption Input */}
                    <div className="p-3">
                      <Label htmlFor={`caption-${photo.id}`} className="text-xs text-gray-600">
                        Descripción (opcional)
                      </Label>
                      <Input
                        id={`caption-${photo.id}`}
                        value={photo.caption}
                        onChange={(e) => updateCaption(photo.id, e.target.value)}
                        placeholder="Ej: Sala de estar, Cocina, Vista desde la terraza..."
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">📸 Consejos para mejores fotos</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Incluye fotos de todas las habitaciones que los guests utilizarán</li>
              <li>• Toma fotos con buena iluminación natural</li>
              <li>• Muestra espacios limpios y organizados</li>
              <li>• Incluye fotos del área externa si está disponible</li>
              <li>• La primera foto será la principal - elige la más atractiva</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhotosStep;
