
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Globe } from "lucide-react";
import { RaceFormData } from "@/types/race";

interface LogisticsStepProps {
  formData: Partial<RaceFormData>;
  onUpdate: (data: Partial<RaceFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const LogisticsStep = ({ formData, onUpdate, onNext, onPrev }: LogisticsStepProps) => {
  const canProceed = () => {
    return formData.points_cost && 
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
          <CardDescription>El sistema asignará automáticamente los puntos del costo de carrera según oferta-demanda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="points_cost">Puntos requeridos para reservar</Label>
            <input
              id="points_cost"
              type="number"
              min="1"
              value={formData.points_cost || 100}
              readOnly
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
            <p className="text-sm text-gray-500 mt-1">
              El sistema asignará automáticamente los puntos del costo de carrera según oferta-demanda
            </p>
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
