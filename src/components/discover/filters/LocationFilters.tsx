
import { Label } from "@/components/ui/label";
import { CustomSelect } from "@/components/ui/custom";
import { MapPin } from "lucide-react";

interface LocationFiltersProps {
  selectedProvince: string;
  onProvinceChange: (province: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  selectedRadius: string;
  onRadiusChange: (radius: string) => void;
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

const radiusOptions = [
  { value: "any", label: "Cualquier distancia" },
  { value: "25", label: "25 km" },
  { value: "50", label: "50 km" },
  { value: "100", label: "100 km" },
  { value: "200", label: "200 km" },
  { value: "500", label: "500 km" },
  { value: "500+", label: "+500 km" }
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
  selectedRadius,
  onRadiusChange
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
          <Label htmlFor="radius">Radio de búsqueda</Label>
          <CustomSelect
            value={selectedRadius}
            onValueChange={onRadiusChange}
            options={radiusOptions}
            placeholder="Cualquier distancia"
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
