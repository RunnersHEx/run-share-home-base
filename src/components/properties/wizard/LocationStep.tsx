
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Search } from "lucide-react";
import { PropertyFormData } from "@/types/property";

// Spanish provinces
const SPANISH_PROVINCES = [
  "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona", 
  "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", 
  "Cuenca", "Girona", "Granada", "Guadalajara", "Guipúzcoa", "Huelva", "Huesca", 
  "Jaén", "La Coruña", "La Rioja", "Las Palmas", "León", "Lleida", "Lugo", "Madrid", 
  "Málaga", "Murcia", "Navarra", "Ourense", "Palencia", "Pontevedra", "Salamanca", 
  "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", 
  "Toledo", "Valencia", "Valladolid", "Vizcaya", "Zamora", "Zaragoza"
];

interface LocationStepProps {
  formData: PropertyFormData;
  onUpdate: (data: Partial<PropertyFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const LocationStep = ({ formData, onUpdate, onNext, onPrev }: LocationStepProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showProvinces, setShowProvinces] = useState(false);

  const filteredProvinces = SPANISH_PROVINCES.filter(province =>
    province.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProvinceSelect = (province: string) => {
    const newProvinces = formData.provinces.includes(province)
      ? formData.provinces.filter(p => p !== province)
      : [...formData.provinces, province];
    
    onUpdate({ provinces: newProvinces });
  };

  const canProceed = () => {
    return formData.provinces.length > 0 && 
           formData.locality.trim() !== "";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Ubicación de tu propiedad</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Province Selection */}
          <div>
            <Label htmlFor="provinces">Provincia(s) *</Label>
            <div className="relative">
              <div className="flex items-center border rounded-lg px-3 py-2 cursor-pointer" 
                   onClick={() => setShowProvinces(!showProvinces)}>
                <Search className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-600">
                  {formData.provinces.length > 0 
                    ? `${formData.provinces.length} provincia(s) seleccionada(s)`
                    : "Selecciona provincia(s)"}
                </span>
              </div>
              
              {showProvinces && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2">
                    <Input
                      placeholder="Buscar provincia..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {filteredProvinces.map(province => (
                      <div
                        key={province}
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                          formData.provinces.includes(province) ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                        onClick={() => handleProvinceSelect(province)}
                      >
                        {province}
                        {formData.provinces.includes(province) && (
                          <span className="ml-2 text-blue-600">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {formData.provinces.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.provinces.map(province => (
                  <span
                    key={province}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {province}
                    <button
                      onClick={() => handleProvinceSelect(province)}
                      className="ml-1 hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* City/Locality */}
          <div>
            <Label htmlFor="locality">Ciudad/Localidad *</Label>
            <Input
              id="locality"
              value={formData.locality}
              onChange={(e) => onUpdate({ locality: e.target.value })}
              placeholder="Ej: Valencia, Barcelona, Madrid..."
              className="mt-1"
            />
          </div>

          {/* Running Areas Description */}
          <div>
            <Label htmlFor="running_description">Describe si existen zonas cercanas a tu casa para correr (Opcional)</Label>
            <textarea
              id="running_description"
              value={formData.runner_instructions || ''}
              onChange={(e) => onUpdate({ runner_instructions: e.target.value })}
              placeholder="Ej: Parque del Retiro a 5 minutos andando, circuito de running de 3km..."
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationStep;
