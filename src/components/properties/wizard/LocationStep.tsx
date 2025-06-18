
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin } from "lucide-react";
import { PropertyFormData } from "../PropertyWizard";

interface LocationStepProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
}

const SPANISH_PROVINCES = [
  "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", 
  "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", 
  "Ciudad Real", "Córdoba", "Cuenca", "Girona",  "Granada", "Guadalajara", 
  "Gipuzkoa", "Huelva", "Huesca", "Jaén", "La Coruña", "La Rioja", "Las Palmas", 
  "León", "Lleida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Ourense", 
  "Palencia", "Pontevedra", "Salamanca", "Santa Cruz de Tenerife", "Segovia", 
  "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid", 
  "Vizcaya", "Zamora", "Zaragoza"
];

const LocationStep = ({ formData, updateFormData }: LocationStepProps) => {
  const handleProvinceChange = (province: string, checked: boolean) => {
    const updatedProvinces = checked
      ? [...formData.provinces, province]
      : formData.provinces.filter(p => p !== province);
    
    updateFormData({ provinces: updatedProvinces });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Ubicación de tu Propiedad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Provincias *</Label>
            <p className="text-sm text-gray-600 mb-4">
              Selecciona las provincias donde está ubicada tu propiedad (puedes seleccionar múltiples si está cerca de límites provinciales)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
              {SPANISH_PROVINCES.map((province) => (
                <div key={province} className="flex items-center space-x-2">
                  <Checkbox
                    id={province}
                    checked={formData.provinces.includes(province)}
                    onCheckedChange={(checked) => handleProvinceChange(province, checked as boolean)}
                  />
                  <Label htmlFor={province} className="text-sm font-normal cursor-pointer">
                    {province}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="locality">Ciudad/Localidad *</Label>
            <Input
              id="locality"
              value={formData.locality}
              onChange={(e) => updateFormData({ locality: e.target.value })}
              placeholder="Ej: Madrid, Barcelona, Valencia..."
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="full_address">Dirección Completa *</Label>
            <Input
              id="full_address"
              value={formData.full_address}
              onChange={(e) => updateFormData({ full_address: e.target.value })}
              placeholder="Calle, número, código postal..."
              className="mt-2"
            />
            <p className="text-sm text-gray-600 mt-1">
              Esta información solo se compartirá con guests confirmados por seguridad
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">📍 Confirmación de Ubicación</h4>
            <p className="text-sm text-blue-800">
              Una vez que completes la dirección, te mostraremos un mapa para que confirmes la ubicación exacta. 
              Esto ayuda a los runners a encontrar las mejores rutas cercanas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationStep;
