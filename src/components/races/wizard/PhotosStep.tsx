
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RaceFormData } from "@/types/race";
import { Upload, X, Image } from "lucide-react";

interface PhotosStepProps {
  formData: Partial<RaceFormData>;
  onUpdate: (data: Partial<RaceFormData>) => void;
}

interface ImagePreview {
  file: File;
  url: string;
  category: string;
  caption: string;
}

export const PhotosStep = ({ formData, onUpdate }: PhotosStepProps) => {
  const [images, setImages] = useState<ImagePreview[]>([]);

  const categories = [
    { value: 'elevation', label: 'Perfil de Elevación', description: 'Gráficos o fotos de desniveles' },
    { value: 'landscape', label: 'Fotos del recorrido/Paisajes destacados', description: 'Vistas panorámicas y puntos destacados de la ruta' },
    { value: 'finish', label: 'Meta y Llegada', description: 'Área de meta y celebración' },
    { value: 'atmosphere', label: 'Ambiente', description: 'Espíritu y ambiente de la carrera' }
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setImages(prev => [...prev, { file, url, category, caption: '' }]);
      }
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].url);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const updateCaption = (index: number, caption: string) => {
    setImages(prev => prev.map((img, i) => i === index ? { ...img, caption } : img));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Fotos y Documentación</h3>
        <p className="text-gray-600 mb-6">
          Sube fotos que muestren la experiencia completa de la carrera (opcional)
        </p>
      </div>

      <div className="grid gap-6">
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
              {images
                .filter(img => img.category === category.value)
                .map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={image.caption || 'Preview'}
                      className="w-full h-32 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(images.indexOf(image))}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <Input
                      placeholder="Caption opcional..."
                      value={image.caption}
                      onChange={(e) => updateCaption(images.indexOf(image), e.target.value)}
                      className="mt-2 text-xs"
                    />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 && (
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

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">📸 Tips para Mejores Fotos</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Incluye fotos del recorrido desde diferentes ángulos</li>
          <li>• Muestra los paisajes más espectaculares</li>
          <li>• Captura el ambiente y la emoción de la carrera</li>
          <li>• Añade captions descriptivos para contextualizar</li>
        </ul>
      </div>
    </div>
  );
};
