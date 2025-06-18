
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/hooks/useProfile";
import { Save, Shield, Home, Plane } from "lucide-react";

const RoleSection = () => {
  const { profile, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    is_host: profile?.is_host || false,
    is_guest: profile?.is_guest || false,
  });

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
      is_host: profile?.is_host || false,
      is_guest: profile?.is_guest || false,
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <span>Rol en la Plataforma</span>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              Editar
            </Button>
          ) : (
            <div className="space-x-2">
              <Button onClick={handleCancel} variant="outline" size="sm">
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
        {/* Host Role */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Home className="h-6 w-6 text-blue-600" />
              <div>
                <Label className="text-lg font-semibold text-blue-700">
                  Quiero ser Host
                </Label>
                <p className="text-sm text-gray-600">
                  Ofrecer mi casa y conocimiento local a corredores visitantes
                </p>
              </div>
            </div>
            <Switch
              checked={formData.is_host}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_host: checked }))}
              disabled={!isEditing}
            />
          </div>
          
          {formData.is_host && (
            <div className="bg-blue-50 p-3 rounded-md">
              <h4 className="font-semibold text-blue-800 mb-2">Como Host podrás:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Ganar puntos por cada experiencia que ofrezcas</li>
                <li>• Conocer corredores de todo el mundo</li>
                <li>• Compartir tu pasión y conocimiento local</li>
                <li>• Crear una fuente de ingresos adicional</li>
              </ul>
            </div>
          )}
        </div>

        {/* Guest Role */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Plane className="h-6 w-6 text-orange-600" />
              <div>
                <Label className="text-lg font-semibold text-orange-700">
                  Quiero ser Guest
                </Label>
                <p className="text-sm text-gray-600">
                  Buscar carreras y alojamiento con experiencia local auténtica
                </p>
              </div>
            </div>
            <Switch
              checked={formData.is_guest}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_guest: checked }))}
              disabled={!isEditing}
            />
          </div>
          
          {formData.is_guest && (
            <div className="bg-orange-50 p-3 rounded-md">
              <h4 className="font-semibold text-orange-800 mb-2">Como Guest podrás:</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Acceder a alojamiento auténtico con hosts runners</li>
                <li>• Obtener conocimiento local sobre carreras y rutas</li>
                <li>• Ahorrar dinero con precios justos</li>
                <li>• Vivir experiencias únicas en cada destino</li>
              </ul>
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">¿Puedo ser ambos?</h4>
          <p className="text-sm text-gray-600">
            ¡Por supuesto! Muchos usuarios disfrutan siendo hosts en su ciudad y guests cuando viajan. 
            Puedes activar ambos roles y cambiarlos cuando quieras.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleSection;
