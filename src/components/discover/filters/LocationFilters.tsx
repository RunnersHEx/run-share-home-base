
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";

interface LocationFiltersProps {
  selectedProvince: string;
  onProvinceChange: (province: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
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

const months = [
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
  onMonthChange
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
          <Select 
            value={selectedProvince} 
            onValueChange={onProvinceChange}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Seleccionar provincia..." />
            </SelectTrigger>
            <SelectContent>
              {spanishProvinces.map((province) => (
                <SelectItem key={province} value={province}>
                  {province}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="radius">Radio de búsqueda</Label>
          <Select>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Cualquier distancia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Cualquier distancia</SelectItem>
              <SelectItem value="25">25 km</SelectItem>
              <SelectItem value="50">50 km</SelectItem>
              <SelectItem value="100">100 km</SelectItem>
              <SelectItem value="200">200 km</SelectItem>
              <SelectItem value="500">500 km</SelectItem>
              <SelectItem value="500+">+500 km</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="month">Mes</Label>
          <Select 
            value={selectedMonth} 
            onValueChange={onMonthChange}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Seleccionar mes..." />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
