import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Globe } from "lucide-react";
import { RaceFormData } from "@/types/race";
import { useBookingCost } from "@/hooks/usePoints";
import { useEffect } from "react";

interface LogisticsStepProps {
  formData: Partial<RaceFormData>;
  onUpdate: (data: Partial<RaceFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const LogisticsStep = ({ formData, onUpdate, onNext, onPrev }: LogisticsStepProps) => {
  const { getProvincialRate } = useBookingCost();

  // Calculate points based on selected province
  const calculateProvincePoints = () => {
    if (!formData.province) return 30; // Default fallback
    return getProvincialRate(formData.province);
  };

  // Update points_cost whenever province changes
  useEffect(() => {
    if (formData.province) {
      const provincialRate = calculateProvincePoints();
      onUpdate({ points_cost: provincialRate });
    }
  }, [formData.province, onUpdate]);

  const provincialRate = calculateProvincePoints();

  const canProceed = () => {
    return formData.points_cost !== undefined && 
           formData.points_cost > 0 && 
           formData.max_guests && 
           formData.max_guests > 0 &&
           formData.max_guests <= 4;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Logística y Costos</h2>
        <p className="text-gray-600 mt-2">Define los aspectos prácticos y económicos</p>
      </div>

      {/* Información Oficial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Información Oficial</span>
          </CardTitle>
          <CardDescription>Enlaces y costos oficiales de la carrera</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="official_website">Sitio web oficial de la carrera</Label>
            <input
              id="official_website"
              type="url"
              value={formData.official_website || ''}
              onChange={(e) => onUpdate({ official_website: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://ejemplo-carrera.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sistema de Puntos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5" />
            <span>Costo en Puntos</span>
          </CardTitle>
          <CardDescription>
            Costo automático basado en la ubicación de la carrera
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="points_cost">Puntos requeridos por noche</Label>
            <div className="flex items-center space-x-3">
              <input
                id="points_cost"
                type="number"
                value={provincialRate}
                readOnly
                disabled
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
              />
              <div className="text-lg font-semibold text-blue-600">
                {provincialRate} puntos/noche
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600">
                <strong>Provincia seleccionada:</strong> {formData.province || 'No seleccionada'}
              </p>
              <p className="text-sm text-gray-500">
                El costo se calcula automáticamente según la provincia donde se realiza la carrera.
                Los guests pagarán {provincialRate} puntos por cada noche de alojamiento.
              </p>
              {!formData.province && (
                <p className="text-sm text-amber-600">
                  ⚠️ Selecciona la provincia en el paso anterior para ver el costo correcto
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacidad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Capacidad de Alojamiento</span>
          </CardTitle>
          <CardDescription>¿Cuántos runners puedes alojar para esta carrera?</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="max_guests">Máximo número de guests</Label>
            <input
              id="max_guests"
              type="number"
              value={formData.max_guests || ''}
              onChange={(e) => {
                const value = e.target.value;
                
                // Allow empty value for clearing
                if (value === '') {
                  onUpdate({ max_guests: undefined });
                  return;
                }
                
                const numValue = parseInt(value);
                
                // Don't update if not a valid number
                if (isNaN(numValue)) {
                  return;
                }
                
                // Only clamp if user tries to go outside 1-4 range
                if (numValue > 4) {
                  onUpdate({ max_guests: 4 });
                } else if (numValue < 1) {
                  onUpdate({ max_guests: 1 });
                } else {
                  // Keep exact value if it's 1, 2, 3, or 4
                  onUpdate({ max_guests: numValue });
                }
              }}
              onBlur={(e) => {
                // Ensure we have a valid value when user leaves the field
                const value = e.target.value;
                if (value === '' || parseInt(value) < 1) {
                  onUpdate({ max_guests: 1 });
                }
              }}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Entre 1 y 4"
            />
            <p className="text-sm text-gray-500 mt-1">
              Considera la capacidad de tu propiedad y tu disponibilidad como anfitrión (máximo 4 guests)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LogisticsStep;