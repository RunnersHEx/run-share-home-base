
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";

const QuickSearchSection = () => {
  const [selectedRaceModalities, setSelectedRaceModalities] = useState<string[]>([]);
  const [selectedDistances, setSelectedDistances] = useState<string[]>([]);

  const handleRaceModalityChange = (modality: string, checked: boolean) => {
    if (checked) {
      setSelectedRaceModalities([...selectedRaceModalities, modality]);
    } else {
      setSelectedRaceModalities(selectedRaceModalities.filter(m => m !== modality));
    }
  };

  const handleDistanceChange = (distance: string, checked: boolean) => {
    if (checked) {
      setSelectedDistances([...selectedDistances, distance]);
    } else {
      setSelectedDistances(selectedDistances.filter(d => d !== distance));
    }
  };

  const spanishProvinces = [
    "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", 
    "Islas Baleares", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", 
    "Castellón", "Ciudad Real", "Córdoba", "La Coruña", "Cuenca", "Gerona", 
    "Granada", "Guadalajara", "Guipúzcoa", "Huelva", "Huesca", "Jaén", "León", 
    "Lérida/Lleida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", 
    "Orense/Ourense", "Palencia", "Las Palmas", "Pontevedra", "La Rioja", 
    "Salamanca", "Segovia", "Sevilla", "Soria", "Tarragona", "Santa Cruz de Tenerife", 
    "Teruel", "Toledo", "Valencia", "Valladolid", "Vizcaya/Bizkaia", "Zamora", 
    "Zaragoza", "Ceuta", "Melilla"
  ];

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const raceModalities = ["Asfalto/Ruta", "Trail/Montaña"];
  
  const raceDistances = [
    "Ultra", "Maratón", "Media Maratón", "20k", "de 20k a 15k", "15k", 
    "10K", "de 10k a 5k", "5K"
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl max-w-4xl mx-auto mb-8 animate-slide-in-right">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Destino</label>
          <Select>
            <SelectTrigger className="runner-input">
              <SelectValue placeholder="Selecciona una provincia" />
            </SelectTrigger>
            <SelectContent>
              {spanishProvinces.map((province) => (
                <SelectItem key={province} value={province.toLowerCase()}>
                  {province}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mes</label>
          <Select>
            <SelectTrigger className="runner-input">
              <SelectValue placeholder="Selecciona un mes" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={month} value={(index + 1).toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Modalidad de Carrera</label>
          <div className="space-y-2 p-3 border border-gray-300 rounded-md bg-white">
            {raceModalities.map((modality) => (
              <div key={modality} className="flex items-center space-x-2">
                <Checkbox
                  id={`modality-${modality}`}
                  checked={selectedRaceModalities.includes(modality)}
                  onCheckedChange={(checked) => handleRaceModalityChange(modality, checked as boolean)}
                />
                <label
                  htmlFor={`modality-${modality}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {modality}
                </label>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Distancia Carrera</label>
          <div className="space-y-2 p-3 border border-gray-300 rounded-md bg-white max-h-32 overflow-y-auto">
            {raceDistances.map((distance) => (
              <div key={distance} className="flex items-center space-x-2">
                <Checkbox
                  id={`distance-${distance}`}
                  checked={selectedDistances.includes(distance)}
                  onCheckedChange={(checked) => handleDistanceChange(distance, checked as boolean)}
                />
                <label
                  htmlFor={`distance-${distance}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {distance}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Button className="runner-button-primary w-full mt-6">
        <Search className="mr-2 h-5 w-5" />
        Buscar Carreras
      </Button>
    </div>
  );
};

export default QuickSearchSection;
