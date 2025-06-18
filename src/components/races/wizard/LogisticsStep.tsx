
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RaceFormData } from "@/types/race";
import { Calculator, Euro, MapPin, Clock } from "lucide-react";

interface LogisticsStepProps {
  formData: Partial<RaceFormData>;
  onUpdate: (data: Partial<RaceFormData>) => void;
}

export const LogisticsStep = ({ formData, onUpdate }: LogisticsStepProps) => {
  const suggestPointsCost = () => {
    const baseCost = formData.registration_cost || 0;
    const suggested = Math.max(10, Math.round(baseCost * 0.3));
    onUpdate({ points_cost: suggested });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Logística y Costos</h3>
        <p className="text-gray-600 mb-6">
          Define los aspectos logísticos y económicos de la carrera
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="distance_from_property" className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>Distancia desde Propiedad (km)</span>
          </Label>
          <Input
            id="distance_from_property"
            type="number"
            step="0.1"
            min="0"
            placeholder="5.2"
            value={formData.distance_from_property || ''}
            onChange={(e) => onUpdate({ distance_from_property: parseFloat(e.target.value) || undefined })}
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            Distancia en kilómetros desde tu propiedad hasta el punto de salida
          </p>
        </div>

        <div>
          <Label htmlFor="official_website">Sitio Web Oficial</Label>
          <Input
            id="official_website"
            type="url"
            placeholder="https://www.maratonpicos.com"
            value={formData.official_website || ''}
            onChange={(e) => onUpdate({ official_website: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="registration_cost" className="flex items-center space-x-2">
            <Euro className="w-4 h-4" />
            <span>Costo Inscripción (€)</span>
          </Label>
          <Input
            id="registration_cost"
            type="number"
            step="0.01"
            min="0"
            placeholder="45.00"
            value={formData.registration_cost || ''}
            onChange={(e) => onUpdate({ registration_cost: parseFloat(e.target.value) || undefined })}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="points_cost" className="flex items-center space-x-2">
            <Calculator className="w-4 h-4" />
            <span>Costo en Puntos para Guests *</span>
          </Label>
          <div className="flex space-x-2 mt-1">
            <Input
              id="points_cost"
              type="number"
              min="0"
              placeholder="15"
              value={formData.points_cost || ''}
              onChange={(e) => onUpdate({ points_cost: parseInt(e.target.value) || 0 })}
            />
            <button
              type="button"
              onClick={suggestPointsCost}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded border"
              disabled={!formData.registration_cost}
            >
              Sugerir
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Puntos que los guests pagarán por la experiencia completa
          </p>
        </div>

        <div>
          <Label htmlFor="max_guests">Máximo Guests que Puedes Alojar *</Label>
          <Input
            id="max_guests"
            type="number"
            min="1"
            max="20"
            placeholder="4"
            value={formData.max_guests || ''}
            onChange={(e) => onUpdate({ max_guests: parseInt(e.target.value) || 1 })}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="start_time" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Horario Aproximado de Salida</span>
          </Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time || ''}
            onChange={(e) => onUpdate({ start_time: e.target.value })}
            className="mt-1"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Consejos para Definir Precios</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Los puntos deben reflejar el valor de tu experiencia local</li>
          <li>• Considera incluir: alojamiento + conocimiento local + acompañamiento</li>
          <li>• Precio sugerido: 20-40% del costo de inscripción</li>
        </ul>
      </div>
    </div>
  );
};
