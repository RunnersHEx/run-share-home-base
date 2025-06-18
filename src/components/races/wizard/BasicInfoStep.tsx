
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RaceFormData } from "@/types/race";
import { useProperties } from "@/hooks/useProperties";

interface BasicInfoStepProps {
  formData: Partial<RaceFormData>;
  onUpdate: (data: Partial<RaceFormData>) => void;
}

export const BasicInfoStep = ({ formData, onUpdate }: BasicInfoStepProps) => {
  const { properties } = useProperties();

  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // Minimum 30 days in future
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Información Básica de la Carrera</h3>
        <p className="text-gray-600 mb-6">
          Comencemos con los datos fundamentales de tu carrera
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Label htmlFor="name">Nombre de la Carrera *</Label>
          <Input
            id="name"
            placeholder="ej: Maratón de Montaña Picos de Europa"
            value={formData.name || ''}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            Elige un nombre atractivo que describa la carrera
          </p>
        </div>

        <div>
          <Label htmlFor="race_date">Fecha de la Carrera *</Label>
          <Input
            id="race_date"
            type="date"
            min={getMinDate()}
            value={formData.race_date || ''}
            onChange={(e) => onUpdate({ race_date: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="registration_deadline">Fecha Límite Inscripción</Label>
          <Input
            id="registration_deadline"
            type="date"
            max={formData.race_date || undefined}
            value={formData.registration_deadline || ''}
            onChange={(e) => onUpdate({ registration_deadline: e.target.value })}
            className="mt-1"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="property_id">Propiedad Asociada *</Label>
          <Select
            value={formData.property_id || ''}
            onValueChange={(value) => onUpdate({ property_id: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecciona la propiedad donde se alojarán los guests" />
            </SelectTrigger>
            <SelectContent>
              {properties.filter(p => p.is_active).map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.title} - {property.locality}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="description">¿Por qué crees que es atractiva esta carrera?</Label>
          <Textarea
            id="description"
            placeholder="Describe qué hace especial a esta carrera, su historia, el recorrido, el ambiente..."
            value={formData.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            maxLength={500}
            rows={4}
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            Máximo 500 palabras ({(formData.description || '').length}/500)
          </p>
        </div>
      </div>
    </div>
  );
};
