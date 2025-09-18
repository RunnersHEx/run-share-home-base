import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  userName: string;
}

export const ProfilePhotoModal = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  userName 
}: ProfilePhotoModalProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] p-0 overflow-hidden border-0"
        onKeyDown={handleKeyPress}
      >
        {/* Header with close button */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="secondary"
            size="icon"
            onClick={onClose}
            className="bg-black/50 hover:bg-black/70 text-white border-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Photo Display */}
        <div className="relative bg-black flex items-center justify-center" style={{ height: '90vh' }}>
          <img
            src={imageUrl}
            alt={`Foto de perfil de ${userName}`}
            className="max-w-full max-h-full object-contain cursor-pointer"
            onClick={onClose}
            onError={(e) => {
              e.currentTarget.src = '/placeholder-image.jpg';
            }}
          />
        </div>

        {/* User name overlay */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-black/50 text-white px-3 py-2 rounded-lg">
            <p className="text-sm font-medium">{userName}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};