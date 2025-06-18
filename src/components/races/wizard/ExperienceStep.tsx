
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RaceFormData } from "@/types/race";
import { Star, MapPin, Thermometer } from "lucide-react";

interface ExperienceStepProps {
  formData: Partial<RaceFormData>;
  onUpdate: (data: Partial<RaceFormData>) => void;
}

export const ExperienceStep = ({ formData, onUpdate }: ExperienceStepProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Experiencia Local</h3>
        <p className="text-gray-600 mb-6">
          Comparte tu conocimiento local para crear una experiencia única
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="highlights" className="flex items-center space-x-2 text-base font-medium">
            <Star className="w-5 h-5 text-[#EA580C]" />
            <span>Race Highlights</span>
          </Label>
          <p className="text-sm text-gray-600 mb-3">
            ¿Qué hace especial a esta carrera? (vistas panorámicas, ambiente festivo, tradición local)
          </p>
          <Textarea
            id="highlights"
            placeholder="ej: Vistas espectaculares de los Picos de Europa, ambiente familiar con música tradicional asturiana, tradición de más de 20 años..."
            value={formData.highlights || ''}
            onChange={(e) => onUpdate({ highlights: e.target.value })}
            rows={4}
            maxLength={500}
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            {(formData.highlights || '').length}/500 caracteres
          </p>
        </div>

        <div>
          <Label htmlFor="local_tips" className="flex items-center space-x-2 text-base font-medium">
            <MapPin className="w-5 h-5 text-[#059669]" />
            <span>Tips Locales</span>
          </Label>
          <p className="text-sm text-gray-600 mb-3">
            Consejos del experto local (estrategia carrera, hidratación, clima, desayuno, llegada, parking)
          </p>
          <Textarea
            id="local_tips"
            placeholder="ej: Llegada recomendada 1h antes por parking limitado. Desayuno ligero en Cafetería La Montaña. Primera mitad conservadora por subida km 15-25. Hidratación extra en avituallamientos km 10 y 30..."
            value={formData.local_tips || ''}
            onChange={(e) => onUpdate({ local_tips: e.target.value })}
            rows={5}
            maxLength={800}
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            {(formData.local_tips || '').length}/800 caracteres
          </p>
        </div>

        <div>
          <Label htmlFor="weather_notes" className="flex items-center space-x-2 text-base font-medium">
            <Thermometer className="w-5 h-5 text-[#1E40AF]" />
            <span>Notas del Clima</span>
          </Label>
          <p className="text-sm text-gray-600 mb-3">
            Temperatura típica, probabilidad de lluvia, viento, consejos de vestimenta
          </p>
          <Textarea
            id="weather_notes"
            placeholder="ej: Temperatura inicio: 8-12°C, llegada: 15-20°C. Probabilidad lluvia 30%. Viento moderado en zona alta km 20-30. Recomendable: camiseta técnica manga larga, cortavientos ligero..."
            value={formData.weather_notes || ''}
            onChange={(e) => onUpdate({ weather_notes: e.target.value })}
            rows={4}
            maxLength={400}
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            {(formData.weather_notes || '').length}/400 caracteres
          </p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">🏃‍♂️ Tips para una Gran Experiencia</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Comparte secretos locales que solo tú conoces</li>
          <li>• Incluye recomendaciones específicas de timing y estrategia</li>
          <li>• Menciona lugares únicos para fotos durante la carrera</li>
          <li>• Sugiere qué llevar según las condiciones típicas</li>
        </ul>
      </div>
    </div>
  );
};
