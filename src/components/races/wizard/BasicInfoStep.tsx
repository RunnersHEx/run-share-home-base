
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CustomSelect } from "@/components/ui/custom";
import { RaceFormData } from "@/types/race";
import { useProperties } from "@/hooks/useProperties";
import { CalendarDays, FileText } from "lucide-react";
import { toast } from "sonner";

interface BasicInfoStepProps {
  formData: Partial<RaceFormData>;
  onUpdate: (data: Partial<RaceFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const BasicInfoStep = ({ formData, onUpdate, onNext, onPrev }: BasicInfoStepProps) => {
  const { properties } = useProperties();

  // Ensure properties is an array to prevent rendering issues
  const safeProperties = Array.isArray(properties) ? properties : [];

  // Spanish provinces for dropdown (matching the database provincial_point_costs table)
  const spanishProvinces = [
    "A Coruña", "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz",
    "Illes Balears", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real",
    "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara", "Guipúzcoa", "Huelva", "Huesca",
    "Jaén", "León", "Lleida", "La Rioja", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra",
    "Ourense", "Palencia", "Las Palmas", "Pontevedra", "Salamanca", "Santa Cruz de Tenerife",
    "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid",
    "Vizcaya", "Zamora", "Zaragoza"
  ];

  const provinceOptions = spanishProvinces.map(province => ({
    value: province,
    label: province
  }));

  // Handle race date changes to validate registration deadline
  const handleRaceDateChange = (newRaceDate: string) => {
    const updates: Partial<RaceFormData> = { race_date: newRaceDate };
    
    // Validate the date is in the future
    if (newRaceDate) {
      const raceDate = new Date(newRaceDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (raceDate <= today) {
        // Don't update if date is not in the future
        toast.error('La fecha de la carrera debe ser posterior a hoy');
        return;
      }
    }
    
    // If there's a registration deadline and it's not before the new race date, clear it
    if (formData.registration_deadline && newRaceDate) {
      const raceDate = new Date(newRaceDate);
      const deadlineDate = new Date(formData.registration_deadline);
      
      if (deadlineDate >= raceDate) {
        updates.registration_deadline = "";
      }
    }
    
    onUpdate(updates);
  };

  // Get tomorrow's date in YYYY-MM-DD format for min attribute
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Race Name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Información Básica de la Carrera
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="race-name">Nombre de la Carrera *</Label>
            <Input
              id="race-name"
              value={formData.name || ""}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Ej: 10K Valencia, Maratón de Barcelona..."
            />
            <p className="text-sm text-gray-600 mt-1">
              Elige un nombre atractivo que describa la carrera
            </p>
          </div>

          <div>
            <Label htmlFor="race-province">Provincia donde se realiza la carrera *</Label>
            <CustomSelect
              value={formData.province || ''}
              onValueChange={(value) => onUpdate({ province: value })}
              options={provinceOptions}
              placeholder="Selecciona la provincia"
              className="w-full"
            />
            <p className="text-sm text-gray-600 mt-1">
              Ciudad o provincia donde se celebra la carrera (para filtros de búsqueda)
            </p>
          </div>

          <div>
            <Label htmlFor="race-description">¿Por qué crees que es atractiva esta carrera? *</Label>
            <Textarea
              id="race-description"
              value={formData.description || ""}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Describe qué hace especial a esta carrera, su historia, el recorrido, el ambiente..."
              rows={4}
              maxLength={500}
            />
            <p className="text-sm text-gray-600 mt-1">
              Máximo 500 palabras (0/500)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Date and Property */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarDays className="h-5 w-5 mr-2" />
            Fechas y Hogar Asociado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="race-date">Fecha de la Carrera *</Label>
              <Input
                id="race-date"
                type="date"
                value={formData.race_date || ""}
                onChange={(e) => handleRaceDateChange(e.target.value)}
                placeholder="dd/mm/yyyy"
                min={getTomorrowDate()}
              />
              <p className="text-sm text-gray-600 mt-1">
                La fecha debe ser posterior a hoy
              </p>
            </div>

            <div>
              <Label htmlFor="registration-deadline">Fecha Límite Inscripción</Label>
              <Input
                id="registration-deadline"
                type="date"
                value={formData.registration_deadline || ""}
                onChange={(e) => onUpdate({ registration_deadline: e.target.value })}
                min={getTomorrowDate()}
                max={formData.race_date ? formData.race_date : undefined}
                placeholder="dd/mm/yyyy"
              />
              <p className="text-sm text-gray-600 mt-1">
                Debe ser anterior a la fecha de la carrera
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="property-select">Propiedad Asociada *</Label>
            <div className="relative">
              <select
                id="property-select"
                value={formData.property_id || ""}
                onChange={(e) => onUpdate({ property_id: e.target.value })}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  Selecciona la propiedad donde se alojarán los guests
                </option>
                {safeProperties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.title} - {property.locality}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {safeProperties.length === 0 && (
              <p className="text-sm text-amber-600 mt-1">
                Primero debes crear una propiedad en la sección "Mi Propiedad"
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { BasicInfoStep };
