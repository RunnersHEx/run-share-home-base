
import { Label } from "@/components/ui/label";
import { CustomSelect } from "@/components/ui/custom";
import { MapPin } from "lucide-react";

interface LocationFiltersProps {
  selectedProvince: string;
  onProvinceChange: (province: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  selectedDistance: string;
  onDistanceChange: (distance: string) => void;
}

const spanishProvinces = [
  "A Coruña", "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz",
  "Baleares", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real",
  "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara", "Gipuzkoa", "Huelva", "Huesca",
  "Jaén", "León", "Lleida", "La Rioja", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra",
  "Ourense", "Palencia", "Las Palmas", "Pontevedra", "Salamanca", "Santa Cruz de Tenerife",
  "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid",
  "Vizcaya", "Zamora", "Zaragoza"
];

const provinceOptions = spanishProvinces.map(province => ({
  value: province,
  label: province
}));

const distanceOptions = [
  { value: "ultra", label: "Ultra" },
  { value: "marathon", label: "Maratón" },
  { value: "half_marathon", label: "Media Maratón" },
  { value: "20k", label: "20K" },
  { value: "15k", label: "15K" },
  { value: "10k", label: "10K" },
  { value: "5k", label: "5K" }
];

const monthOptions = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" }
];



export const LocationFilters = ({
  selectedProvince,
  onProvinceChange,
  selectedMonth,
  onMonthChange,
  selectedDistance,
  onDistanceChange
}: LocationFiltersProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#1E40AF]" />
        <h3 className="font-semibold">Ubicación y Fechas</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="province">Provincia</Label>
          <CustomSelect
            value={selectedProvince}
            onValueChange={onProvinceChange}
            options={provinceOptions}
            placeholder="Seleccionar provincia..."
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="distance">Distancia de carrera</Label>
          <CustomSelect
            value={selectedDistance}
            onValueChange={onDistanceChange}
            options={distanceOptions}
            placeholder="Seleccionar distancia..."
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="month">Mes</Label>
          <CustomSelect
            value={selectedMonth}
            onValueChange={onMonthChange}
            options={monthOptions}
            placeholder="Seleccionar mes..."
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
};
