import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { Camera, Save, Edit, X } from "lucide-react";
import { toast } from "sonner";

const PersonalInfoSection = () => {
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    await uploadAvatar(file);
  };

  const getInitials = () => {
    const first = profile?.first_name?.charAt(0) || '';
    const last = profile?.last_name?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  // Update form data when profile changes
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
        {/* Mensaje de ayuda cuando no está editando */}
        {!isEditing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              💡 Haz clic en "Editar" para modificar tu información personal
            </p>
          </div>
        )}

        {/* Avatar */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.profile_image_url || ''} alt="Foto de perfil" />
              <AvatarFallback className="bg-blue-600 text-white text-xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <Button
              size="sm"
              className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
              onClick={() => fileInputRef.current?.click()}
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
            <h3 className="font-semibold text-lg">Foto de Perfil</h3>
            <p className="text-sm text-gray-600">
              JPG, PNG o GIF. Máximo 5MB.
            </p>
          </div>
        </div>

        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Nombre</Label>
            <Input
              id="first_name"
              value={isEditing ? formData.first_name : (profile?.first_name || '')}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              disabled={!isEditing}
              className={!isEditing ? "bg-gray-50 cursor-not-allowed" : ""}
              placeholder={isEditing ? "Ingresa tu nombre" : "No especificado"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Apellidos</Label>
            <Input
              id="last_name"
              value={isEditing ? formData.last_name : (profile?.last_name || '')}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              disabled={!isEditing}
              className={!isEditing ? "bg-gray-50 cursor-not-allowed" : ""}
              placeholder={isEditing ? "Ingresa tus apellidos" : "No especificado"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={isEditing ? formData.phone : (profile?.phone || '')}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={!isEditing}
              className={!isEditing ? "bg-gray-50 cursor-not-allowed" : ""}
              placeholder={isEditing ? "Ingresa tu teléfono" : "No especificado"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
            <Input
              id="birth_date"
              type="date"
              value={isEditing ? formData.birth_date : (profile?.birth_date || '')}
              onChange={(e) => handleInputChange('birth_date', e.target.value)}
              disabled={!isEditing}
              className={!isEditing ? "bg-gray-50 cursor-not-allowed" : ""}
            />
          </div>
        </div>

        {/* Contacto de emergencia */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Contacto de Emergencia</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Nombre del Contacto</Label>
              <Input
                id="emergency_contact_name"
                value={isEditing ? formData.emergency_contact_name : (profile?.emergency_contact_name || '')}
                onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50 cursor-not-allowed" : ""}
                placeholder={isEditing ? "Nombre del contacto de emergencia" : "No especificado"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Teléfono del Contacto</Label>
              <Input
                id="emergency_contact_phone"
                type="tel"
                value={isEditing ? formData.emergency_contact_phone : (profile?.emergency_contact_phone || '')}
                onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50 cursor-not-allowed" : ""}
                placeholder={isEditing ? "Teléfono del contacto" : "No especificado"}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoSection;
