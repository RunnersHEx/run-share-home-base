
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Save, Edit, X } from "lucide-react";
import { ProfileAvatarSection } from "./personal/ProfileAvatarSection";
import { BasicInfoFields } from "./personal/BasicInfoFields";
import { EmergencyContactFields } from "./personal/EmergencyContactFields";
import { dateUtils } from "@/utils/dateUtils";
import { toast } from "sonner";

const PersonalInfoSection = () => {
  const { profile, updateProfile, uploadAvatar, refetchProfile } = useProfile();
  const { refreshProfile, profile: authProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for image preview
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    birth_date: dateUtils.formatForInput(profile?.birth_date),
    emergency_contact_name: profile?.emergency_contact_name || '',
    emergency_contact_phone: profile?.emergency_contact_phone || '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (file: File, previewUrl: string) => {
    setSelectedImageFile(file);
    setPreviewImageUrl(previewUrl);
  };

  const clearImagePreview = () => {
    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
    }
    setSelectedImageFile(null);
    setPreviewImageUrl(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('Updating profile data...', formData);
      
      // First update the profile data (excluding image)
      const success = await updateProfile(formData);
      
      if (success) {
        console.log('Profile data updated successfully');
        
        // If there's a selected image, upload it separately
        if (selectedImageFile) {
          console.log('Uploading new avatar...');
          const avatarUrl = await uploadAvatar(selectedImageFile);
          
          if (avatarUrl) {
            console.log('Avatar uploaded successfully:', avatarUrl);
            
            // Store the new image URL in localStorage for immediate UI updates
            localStorage.setItem('temp_profile_image_url', avatarUrl);
            console.log('Stored new image URL in localStorage:', avatarUrl);
            
            // Trigger immediate UI update by dispatching storage event
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'temp_profile_image_url',
              newValue: avatarUrl,
              storageArea: localStorage
            }));
            
            // Clear the preview since the image is now saved
            clearImagePreview();
            
            // Simple single refresh after a delay
            setTimeout(async () => {
              try {
                console.log('Single profile refresh after image upload...');
                await Promise.all([
                  refetchProfile(),
                  refreshProfile()
                ]);
                
                // Clean up localStorage after refresh
                setTimeout(() => {
                  console.log('Cleaning localStorage');
                  localStorage.removeItem('temp_profile_image_url');
                }, 1000);
                
              } catch (error) {
                console.warn('Error refreshing profiles:', error);
              }
            }, 1000);
            
          } else {
            toast.error('Error al subir la foto de perfil');
          }
        } else {
          // No image selected, just show success for profile update
          toast.success('Perfil actualizado correctamente');
        }
        
        setIsEditing(false);
      } else {
        toast.error('Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone: profile?.phone || '',
      birth_date: dateUtils.formatForInput(profile?.birth_date),
      emergency_contact_name: profile?.emergency_contact_name || '',
      emergency_contact_phone: profile?.emergency_contact_phone || '',
    });
    // Clear any image preview when canceling
    clearImagePreview();
    setIsEditing(false);
  };

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        birth_date: dateUtils.formatForInput(profile.birth_date),
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
      });
      // Clear any existing preview when profile updates
      clearImagePreview();
    }
  }, [profile]);

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            Información Personal
            {isEditing && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Modo Edición
              </Badge>
            )}
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="space-x-2">
              <Button onClick={handleCancel} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} size="sm" disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isEditing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              💡 Haz clic en "Editar" para modificar tu información personal
            </p>
          </div>
        )}

        <ProfileAvatarSection 
          profile={profile} 
          isEditing={isEditing}
          previewImageUrl={previewImageUrl}
          onImageSelect={handleImageSelect}
        />

        <BasicInfoFields 
          formData={formData}
          profile={profile}
          isEditing={isEditing}
          handleInputChange={handleInputChange}
        />

        <EmergencyContactFields 
          formData={formData}
          profile={profile}
          isEditing={isEditing}
          handleInputChange={handleInputChange}
        />
      </CardContent>
    </Card>
  );
};

export default PersonalInfoSection;
