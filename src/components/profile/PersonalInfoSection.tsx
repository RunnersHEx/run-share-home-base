
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { Save, Edit, X } from "lucide-react";
import { ProfileAvatarSection } from "./personal/ProfileAvatarSection";
import { BasicInfoFields } from "./personal/BasicInfoFields";
import { EmergencyContactFields } from "./personal/EmergencyContactFields";

const PersonalInfoSection = () => {
  const { profile, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    birth_date: profile?.birth_date || '',
    emergency_contact_name: profile?.emergency_contact_name || '',
    emergency_contact_phone: profile?.emergency_contact_phone || '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await updateProfile(formData);
    if (success) {
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    setFormData({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone: profile?.phone || '',
      birth_date: profile?.birth_date || '',
      emergency_contact_name: profile?.emergency_contact_name || '',
      emergency_contact_phone: profile?.emergency_contact_phone || '',
    });
    setIsEditing(false);
  };

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        birth_date: profile.birth_date || '',
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
      });
    }
  }, [profile]);

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

        <ProfileAvatarSection profile={profile} />

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
