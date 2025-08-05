import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X, Download, Star } from "lucide-react";

interface Photo {
  id: string;
  image_url: string;
  caption?: string;
  category?: string;
  display_order?: number;
}

interface PhotoGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: Photo[];
  title?: string;
  initialPhotoIndex?: number;
}

export const PhotoGalleryModal = ({ 
  isOpen, 
  onClose, 
  photos, 
  title = "Galería de Fotos",
  initialPhotoIndex = 0 
}: PhotoGalleryModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  console.log('🔄 PhotoGalleryModal: Component mounted/updated with', photos?.length, 'photos, isOpen:', isOpen);

  // Organize photos: cover image first, then others sorted by display_order
  const organizedPhotos = photos ? (() => {
    const coverPhoto = photos.find(photo => photo.category === 'cover');
    const otherPhotos = photos.filter(photo => photo.category !== 'cover')
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    return coverPhoto ? [coverPhoto, ...otherPhotos] : otherPhotos;
  })() : [];

  // Reset only on modal close/open cycle - no useEffect
  const handleModalClose = () => {
    console.log('🖼️ PhotoGalleryModal: Closing modal, resetting currentIndex from', currentIndex, 'to 0');
    setCurrentIndex(0);
    onClose();
  };

  if (!organizedPhotos || organizedPhotos.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-600">No hay fotos disponibles para mostrar.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentPhoto = organizedPhotos[currentIndex];

  const goToPrevious = () => {
    if (!organizedPhotos || organizedPhotos.length === 0 || currentIndex <= 0) {
      console.log('⛔ PhotoGalleryModal: Previous blocked - currentIndex:', currentIndex, 'length:', organizedPhotos?.length);
      return;
    }
    const newIndex = currentIndex - 1;
    console.log('⬅️ PhotoGalleryModal: Previous from', currentIndex + 1, 'to', newIndex + 1, 'of', organizedPhotos.length);
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    if (!organizedPhotos || organizedPhotos.length === 0 || currentIndex >= organizedPhotos.length - 1) {
      console.log('⛔ PhotoGalleryModal: Next blocked - currentIndex:', currentIndex, 'length:', organizedPhotos?.length);
      return;
    }
    const newIndex = currentIndex + 1;
    console.log('➡️ PhotoGalleryModal: Next from', currentIndex + 1, 'to', newIndex + 1, 'of', organizedPhotos.length);
    setCurrentIndex(newIndex);
  };

  // Check if navigation arrows should be disabled
  const isPrevDisabled = currentIndex <= 0;
  const isNextDisabled = currentIndex >= (organizedPhotos?.length || 1) - 1;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && !isPrevDisabled) goToPrevious();
    if (e.key === 'ArrowRight' && !isNextDisabled) goToNext();
    if (e.key === 'Escape') handleModalClose();
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent 
        className="max-w-5xl max-h-[90vh] p-0 overflow-hidden"
        onKeyDown={handleKeyPress}
      >
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Foto {currentIndex + 1}/{organizedPhotos.length}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadImage(currentPhoto.image_url, `photo-${currentPhoto.id}.jpg`)}
              >
                <Download className="w-4 h-4 mr-1" />
                Descargar
              </Button>
              <Button variant="ghost" size="icon" onClick={handleModalClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Main Photo Display */}
        <div className="relative bg-black flex items-center justify-center" style={{ height: '60vh' }}>
          <img
            src={currentPhoto.image_url}
            alt={currentPhoto.caption || `Foto ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-image.jpg';
            }}
          />

          {/* Navigation Arrows */}
          {organizedPhotos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-white ${
                  isPrevDisabled 
                    ? 'bg-black/20 cursor-not-allowed opacity-50' 
                    : 'bg-black/50 hover:bg-black/70'
                }`}
                onClick={goToPrevious}
                disabled={isPrevDisabled}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-white ${
                  isNextDisabled 
                    ? 'bg-black/20 cursor-not-allowed opacity-50' 
                    : 'bg-black/50 hover:bg-black/70'
                }`}
                onClick={goToNext}
                disabled={isNextDisabled}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* Photo Info Overlay - Remove cover badge completely */}
        </div>

        {/* Photo Caption */}
        {currentPhoto.caption && (
          <div className="px-6 py-3 bg-gray-50 border-t">
            <p className="text-sm text-gray-700">{currentPhoto.caption}</p>
          </div>
        )}

        {/* Thumbnail Navigation */}
        {organizedPhotos.length > 1 && (
          <div className="px-6 py-4 border-t">
            <div className="flex space-x-2 overflow-x-auto">
              {organizedPhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={photo.image_url}
                    alt={photo.caption || `Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-image.jpg';
                    }}
                  />
                  {/* Show star for cover image */}
                  {photo.category === 'cover' && (
                    <Star className="absolute top-1 right-1 w-3 h-3 text-yellow-500 fill-current" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
