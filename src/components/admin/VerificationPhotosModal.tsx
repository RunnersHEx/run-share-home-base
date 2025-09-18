import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface VerificationPhoto {
  url: string;
  type: string;
  index: number;
}

interface VerificationPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: VerificationPhoto[];
  userName: string;
  title?: string;
}

export const VerificationPhotosModal = ({ 
  isOpen, 
  onClose, 
  photos, 
  userName,
  title = "Documentos de Verificación"
}: VerificationPhotosModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <p className="text-gray-600">No hay documentos de verificación disponibles.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentPhoto = photos[currentIndex];

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && currentIndex > 0) goToPrevious();
    if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) goToNext();
    if (e.key === 'Escape') onClose();
  };

  const getDocumentTypeLabel = (url: string, index: number) => {
    const filename = url.split('/').pop() || '';
    
    // Try to determine document type from filename or URL patterns
    if (filename.toLowerCase().includes('dni') || filename.toLowerCase().includes('id')) {
      return 'DNI/ID';
    } else if (filename.toLowerCase().includes('selfie') || filename.toLowerCase().includes('self')) {
      return 'Selfie con ID';
    } else if (filename.toLowerCase().includes('passport')) {
      return 'Pasaporte';
    } else {
      return `Documento ${index + 1}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-5xl max-h-[90vh] p-0 overflow-hidden border-0"
        onKeyDown={handleKeyPress}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title} - {userName}</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <div className="bg-black/50 text-white px-3 py-2 rounded-lg">
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm opacity-90">{userName}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="bg-black/50 text-white px-3 py-2 rounded-lg">
              <p className="text-sm">
                {currentIndex + 1} de {photos.length}
              </p>
            </div>
            <Button
              variant="secondary"
              size="icon"
              onClick={onClose}
              className="bg-black/50 hover:bg-black/70 text-white border-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main Photo Display */}
        <div className="relative bg-black flex items-center justify-center" style={{ height: '85vh' }}>
          <img
            src={currentPhoto.url}
            alt={`Documento de verificación ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onLoad={() => console.log('Image loaded successfully:', currentPhoto.url)}
            onError={(e) => {
              console.error('Error loading verification image:', currentPhoto.url);
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04My4zMzMzIDY2LjY2NjdIMTE2LjY2N0MxMTguNTA3IDY2LjY2NjcgMTIwIDY4LjE1OTcgMTIwIDcwVjEzMEMxMjAgMTMxLjg0IDExOC41MDcgMTMzLjMzMyAxMTYuNjY3IDEzMy4zMzNIODMuMzMzM0M4MS40OTMgMTMzLjMzMyA4MCA1MTMxLjg0IDgwIDUxMzBWNzBDODAgNjguMTU5NyA4MS40OTMgNjYuNjY2NyA4My4zMzMzIDY2LjY2NjdaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNOTMuMzMzMyA5MC40NEwxMDYuNjY3IDEwMy4zM0wxMjMuMzMzIDg2LjY2NjciIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';
            }}
          />

          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-white ${
                  currentIndex === 0 
                    ? 'bg-black/20 cursor-not-allowed opacity-50' 
                    : 'bg-black/50 hover:bg-black/70'
                }`}
                onClick={goToPrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-white ${
                  currentIndex === photos.length - 1 
                    ? 'bg-black/20 cursor-not-allowed opacity-50' 
                    : 'bg-black/50 hover:bg-black/70'
                }`}
                onClick={goToNext}
                disabled={currentIndex === photos.length - 1}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}
        </div>

        {/* Document Type and Thumbnail Navigation */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex items-center justify-between">
            {/* Document Type Badge */}
            <div className="bg-black/50 text-white px-3 py-2 rounded-lg">
              <Badge variant="secondary" className="text-xs">
                {getDocumentTypeLabel(currentPhoto.url, currentIndex)}
              </Badge>
            </div>

            {/* Thumbnail Navigation */}
            {photos.length > 1 && (
              <div className="flex space-x-2 max-w-md overflow-x-auto">
                {photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentIndex 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={`Documento ${index + 1}`}
                      className="w-full h-full object-cover"
                      onLoad={() => console.log('Thumbnail loaded:', photo.url)}
                      onError={(e) => {
                        console.error('Error loading thumbnail:', photo.url);
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNi42NjY3IDEzLjMzMzNIMjMuMzMzM0MyNC4wNjk3IDEzLjMzMzMgMjQuNjY2NyAxMy45MzAzIDI0LjY2NjcgMTQuNjY2N1YyNi42NjY3QzI0LjY2NjcgMjcuNDAzIDI0LjA2OTcgMjggMjMuMzMzMyAyOEgxNi42NjY3QzE1LjkzMDMgMjggMTUuMzMzMyAyNy40MDMgMTUuMzMzMyAyNi42NjY3VjE0LjY2NjdDMTUuMzMzMyAxMy45MzAzIDE1LjkzMDMgMTMuMzMzMyAxNi42NjY3IDEzLjMzMzNaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMC41Ii8+CjxwYXRoIGQ9Ik0xOC42NjY3IDE4LjMzMzNMMjEuMzMzMyAyMUwyNC42NjY3IDE3LjMzMzMiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIwLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};