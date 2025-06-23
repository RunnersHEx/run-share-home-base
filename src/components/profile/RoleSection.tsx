
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
    is_host: true, // Siempre true
    is_guest: true, // Siempre true
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Asegurar que ambos roles permanezcan activos
    const success = await updateProfile({ is_host: true, is_guest: true });
    if (success) {
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    setFormData({
      is_host: true,
      is_guest: true,
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
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mensaje obligatorio */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium">
            ⚠️ Es OBLIGATORIO activar ambos roles para desempeñar las funciones tanto de Host como Guest y disfrutar al máximo de la experiencia
          </p>
        </div>

        {/* Host Role */}
        <div className="border rounded-lg p-4 space-y-4 bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Home className="h-6 w-6 text-blue-600" />
              <div>
                <Label className="text-lg font-semibold text-blue-700">
                  Eres Host
                </Label>
                <p className="text-sm text-gray-600">
                  Ofreces tu casa y conocimiento local a corredores visitantes
                </p>
              </div>
            </div>
            <Switch
              checked={true}
              disabled={true}
            />
          </div>
          
          <div className="bg-blue-100 p-3 rounded-md">
            <h4 className="font-semibold text-blue-800 mb-2">Como Host puedes:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Ganar puntos por cada experiencia que ofrezcas</li>
              <li>• Conocer corredores de todo el mundo</li>
              <li>• Compartir tu pasión y conocimiento local</li>
              <li>• Crear una fuente de ingresos adicional</li>
            </ul>
          </div>
        </div>

        {/* Guest Role */}
        <div className="border rounded-lg p-4 space-y-4 bg-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Plane className="h-6 w-6 text-orange-600" />
              <div>
                <Label className="text-lg font-semibold text-orange-700">
                  Eres Guest
                </Label>
                <p className="text-sm text-gray-600">
                  Buscas carreras y alojamiento con experiencia local auténtica
                </p>
              </div>
            </div>
            <Switch
              checked={true}
              disabled={true}
            />
          </div>
          
          <div className="bg-orange-100 p-3 rounded-md">
            <h4 className="font-semibold text-orange-800 mb-2">Como Guest puedes:</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Acceder a alojamiento auténtico con hosts runners</li>
              <li>• Obtener conocimiento local sobre carreras y rutas</li>
              <li>• Ahorrar dinero con precios justos</li>
              <li>• Vivir experiencias únicas en cada destino</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleSection;
