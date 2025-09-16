import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomMultiSelect } from "@/components/ui/custom";
import { MapPin } from "lucide-react";
import { PropertyFormData } from "@/types/property";

// Spanish provinces (matching the database provincial_point_costs table)
const SPANISH_PROVINCES = [
  "Outside Spain", // Option for international properties
  "A Coruña", "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz",
  "Illes Balears", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real",
  "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara", "Guipúzcoa", "Huelva", "Huesca",
  "Jaén", "León", "Lleida", "La Rioja", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra",
  "Ourense", "Palencia", "Las Palmas", "Pontevedra", "Salamanca", "Santa Cruz de Tenerife",
  "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid",
  "Vizcaya", "Zamora", "Zaragoza"
];

interface LocationStepProps {
  formData: PropertyFormData;
  onUpdate: (data: Partial<PropertyFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const LocationStep = ({ formData, onUpdate, onNext, onPrev }: LocationStepProps) => {
  // Convert provinces array to options for CustomMultiSelect
  const provinceOptions = SPANISH_PROVINCES.map(province => ({
    value: province,
    label: province
  }));

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
            <CustomMultiSelect
              value={formData.provinces || []}
              onValueChange={(value) => onUpdate({ provinces: value })}
              options={provinceOptions}
              placeholder="Selecciona provincia(s)"
              className="w-full"
            />
            <p className="text-sm text-gray-600 mt-1">
              Selecciona las provincias donde está ubicada tu propiedad. Elige "Outside Spain" si tu propiedad está fuera de España.
            </p>
          </div>

          {/* City/Locality */}
          <div>
            <Label htmlFor="locality">Ciudad/Localidad *</Label>
            <Input
              id="locality"
              value={formData.locality}
              onChange={(e) => onUpdate({ locality: e.target.value })}
              placeholder="Ej: Valencia, Barcelona, London, New York..."
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
