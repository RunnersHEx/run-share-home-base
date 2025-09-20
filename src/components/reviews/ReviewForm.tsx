
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface ReviewFormProps {
  bookingId: string;
  revieweeId: string;
  revieweeName: string;
  reviewType: 'host_to_guest' | 'guest_to_host';
  onSubmit: (reviewData: any) => void;
  onCancel: () => void;
}

const ReviewForm = ({ 
  bookingId, 
  revieweeId, 
  revieweeName, 
  reviewType, 
  onSubmit, 
  onCancel 
}: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categories, setCategories] = useState<Record<string, number>>({});

  const hostCategories = [
    { key: 'comunicacion', label: 'Comunicación' },
    { key: 'limpieza', label: 'Limpieza' },
    { key: 'precision', label: 'Puntualidad' },
    { key: 'ubicacion', label: 'Ubicación' },
    { key: 'valor', label: 'Facilidad' },
    { key: 'experiencia_local', label: 'Experiencia Local' }
  ];

  const guestCategories = [
    { key: 'comunicacion', label: 'Comunicación' },
    { key: 'respeto', label: 'Respeto' },
    { key: 'limpieza', label: 'Limpieza' },
    { key: 'puntualidad', label: 'Puntualidad' },
    { key: 'facilidad', label: 'Facilidad' }
  ];

  const categoryList = reviewType === 'host_to_guest' ? guestCategories : hostCategories;

  const handleCategoryRating = (category: string, rating: number) => {
    setCategories(prev => ({ ...prev, [category]: rating }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error("Por favor, selecciona una valoración general");
      return;
    }
    
    if (content.length < 50) {
      toast.error("El comentario debe tener al menos 50 caracteres");
      return;
    }

    const reviewData = {
      booking_id: bookingId,
      reviewee_id: revieweeId,
      rating,
      title: title.trim() || null,
      content: content.trim(),
      review_type: reviewType,
      categories
    };

    onSubmit(reviewData);
  };

  const renderStars = (currentRating: number, onRate: (rating: number) => void, size = "h-6 w-6") => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${size} cursor-pointer transition-colors ${
          i < (hoveredRating || currentRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
        onClick={() => onRate(i + 1)}
        onMouseEnter={() => setHoveredRating(i + 1)}
        onMouseLeave={() => setHoveredRating(0)}
      />
    ));
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          Valorar experiencia con {revieweeName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating General */}
          <div>
            <Label className="text-base font-medium">Valoración General *</Label>
            <div className="flex items-center mt-2">
              {renderStars(rating, setRating)}
              <span className="ml-3 text-lg font-medium">
                {rating > 0 && `${rating}/5`}
              </span>
            </div>
          </div>

          {/* Categorías específicas */}
          <div>
            <Label className="text-base font-medium">Valoraciones específicas</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {categoryList.map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <Label className="text-sm">{label}</Label>
                  <div className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 cursor-pointer ${
                          i < (categories[key] || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                        onClick={() => handleCategoryRating(key, i + 1)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <Label htmlFor="title">Título (opcional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Experiencia increíble en Maratón de Madrid"
              maxLength={100}
            />
          </div>

          {/* Comentario */}
          <div>
            <Label htmlFor="content">Comentario *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Comparte tu experiencia detallada..."
              rows={4}
              maxLength={500}
              className="mt-1"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>Mínimo 50 caracteres</span>
              <span>{content.length}/500</span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex space-x-4">
            <Button type="submit" className="flex-1">
              Enviar Valoración
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;
