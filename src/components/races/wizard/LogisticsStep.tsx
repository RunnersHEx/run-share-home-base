
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Euro, Trophy, Users, Globe } from "lucide-react";
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
           formData.max_guests > 0;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Logística y Costos</h2>
        <p className="text-gray-600 mt-2">Define los aspectos prácticos y económicos</p>
      </div>

      {/* Distancia y Ubicación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Ubicación y Distancia</span>
          </CardTitle>
          <CardDescription>Información sobre la proximidad a tu propiedad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="distance_from_property">Distancia desde tu propiedad (km)</Label>
            <input
              id="distance_from_property"
              type="number"
              step="0.1"
              min="0"
              value={formData.distance_from_property || ''}
              onChange={(e) => onUpdate({ distance_from_property: parseFloat(e.target.value) || 0 })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: 2.5"
            />
            <p className="text-sm text-gray-500 mt-1">
              ¿A qué distancia está la salida de la carrera desde tu alojamiento?
            </p>
          </div>
        </CardContent>
      </Card>

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

          <div>
            <Label htmlFor="registration_cost">Costo de inscripción (€)</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="registration_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.registration_cost || ''}
                onChange={(e) => onUpdate({ registration_cost: parseFloat(e.target.value) || 0 })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="25.00"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Precio oficial de inscripción a la carrera
            </p>
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
              value={formData.points_cost || ''}
              onChange={(e) => onUpdate({ points_cost: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="100"
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
              min="1"
              max="20"
              value={formData.max_guests || ''}
              onChange={(e) => onUpdate({ max_guests: parseInt(e.target.value) || 1 })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Considera la capacidad de tu propiedad y tu disponibilidad como anfitrión
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev}>
          Anterior
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!canProceed()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default LogisticsStep;
