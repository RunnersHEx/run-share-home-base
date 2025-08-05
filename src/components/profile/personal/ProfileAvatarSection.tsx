
import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { toast } from "sonner";

interface ProfileAvatarSectionProps {
  profile: any;
  isEditing: boolean;
  previewImageUrl: string | null;
  onImageSelect: (file: File, previewUrl: string) => void;
}

export const ProfileAvatarSection = ({ profile, isEditing, previewImageUrl, onImageSelect }: ProfileAvatarSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    onImageSelect(file, previewUrl);

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCameraClick = () => {
    if (!isEditing) {
      toast.error('Debes activar el modo edición para cambiar la foto de perfil');
      return;
    }
    fileInputRef.current?.click();
  };

  const getInitials = () => {
    const first = profile?.first_name?.charAt(0) || '';
    const last = profile?.last_name?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  // Determine which image to show: preview > profile image > fallback
  const displayImageUrl = previewImageUrl || profile?.profile_image_url || '';
  const hasPreview = !!previewImageUrl;

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <Avatar 
          className={`h-20 w-20 ${hasPreview ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
          key={displayImageUrl || 'no-image'}
        >
          <AvatarImage 
            src={displayImageUrl} 
            alt="Foto de perfil corriendo"
            className="object-cover"
          />
          <AvatarFallback className="bg-blue-600 text-white text-xl">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <Button
          size="sm"
          className={`absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 ${
            !isEditing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={handleCameraClick}
          disabled={!isEditing}
        >
          <Camera className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>
      <div>
        <h3 className="font-semibold text-lg">Foto de Perfil Corriendo</h3>
        <p className="text-sm text-gray-600">
          Foto tuya corriendo o con medalla de finisher donde se te reconozca. JPG, PNG o GIF. Máximo 5MB.
        </p>
        <p className="text-xs text-blue-700 mt-1">
          Esta foto también se usa como "Foto en Carrera" en tu verificación de identidad.
        </p>
        {!isEditing && (
          <p className="text-sm text-amber-600 mt-2">
            💡 Activa el modo edición para cambiar la foto
          </p>
        )}
        {hasPreview && (
          <p className="text-sm text-green-600 mt-2">
            ✅ Nueva foto seleccionada - guarda los cambios para aplicar
          </p>
        )}
      </div>
    </div>
  );
};
