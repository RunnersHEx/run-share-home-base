
import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

interface ProfileAvatarSectionProps {
  profile: any;
}

export const ProfileAvatarSection = ({ profile }: ProfileAvatarSectionProps) => {
  const { uploadAvatar } = useProfile();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      console.log('Uploading new avatar from PersonalInfoSection...');
      const avatarUrl = await uploadAvatar(file);
      if (avatarUrl) {
        console.log('Avatar uploaded successfully:', avatarUrl);
        toast.success('Foto de perfil actualizada correctamente');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Error al subir la foto de perfil');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getInitials = () => {
    const first = profile?.first_name?.charAt(0) || '';
    const last = profile?.last_name?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <Avatar 
          className="h-20 w-20"
          key={profile?.profile_image_url || 'no-image'}
        >
          <AvatarImage 
            src={profile?.profile_image_url || ''} 
            alt="Foto de perfil corriendo"
            className="object-cover"
          />
          <AvatarFallback className="bg-blue-600 text-white text-xl">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <Button
          size="sm"
          className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingAvatar}
        >
          <Camera className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
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
        {isUploadingAvatar && (
          <p className="text-sm text-blue-600 mt-2">Subiendo foto...</p>
        )}
      </div>
    </div>
  );
};
