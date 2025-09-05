
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Calendar, Trophy } from "lucide-react";
import { RaceFilters } from "@/types/race";
import { CustomSelect } from "@/components/ui/custom";

const QuickSearchSection = () => {
  const navigate = useNavigate();
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedModality, setSelectedModality] = useState("");
  const [selectedDistance, setSelectedDistance] = useState("");

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

  const modalityOptions = [
    { value: "road", label: "Ruta/Asfalto" },
    { value: "trail", label: "Trail/Montaña" }
  ];

  const distanceOptions = [
    { value: "ultra", label: "Ultra" },
    { value: "marathon", label: "Maratón" },
    { value: "half_marathon", label: "Media Maratón" },
    { value: "20k", label: "20K" },
    { value: "15k", label: "15K" },
    { value: "10k", label: "10K" },
    { value: "5k", label: "5K" }
  ];

  const handleSearch = () => {
    // Build filters object only with selected values (no defaults)
    const filters: RaceFilters = {};
    
    if (selectedProvince) {
      filters.province = selectedProvince;
    }
    
    if (selectedMonth) {
      filters.month = selectedMonth;
    }
    
    if (selectedModality) {
      filters.modalities = [selectedModality as any];
    }
    
    if (selectedDistance) {
      filters.distances = [selectedDistance as any];
    }

    console.log('QuickSearch: Navigating with filters:', filters);

    // Navigate to discover page with filters as URL parameters
    const searchParams = new URLSearchParams();
    
    if (selectedProvince) {
      searchParams.set('province', selectedProvince);
    }
    
    if (selectedMonth) {
      searchParams.set('month', selectedMonth);
    }
    
    if (selectedModality) {
      searchParams.set('modality', selectedModality);
    }
    
    if (selectedDistance) {
      searchParams.set('distance', selectedDistance);
    }

    const queryString = searchParams.toString();
    const url = queryString ? `/discover?${queryString}` : '/discover';
    
    console.log('QuickSearch: Navigating to:', url);
    navigate(url);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 -mt-12 relative z-10 mx-4" style={{ position: 'relative', zIndex: 1000 }}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Encuentra tu próxima aventura
        </h2>
        <p className="text-gray-600">
          Filtra por cualquier criterio que desees - todos los campos son opcionales
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6" style={{ position: 'relative', zIndex: 1000 }}>
        {/* Destino */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1E40AF]" />
            Destino
          </label>
          <CustomSelect
            value={selectedProvince}
            onValueChange={setSelectedProvince}
            options={provinceOptions}
            placeholder="Selecciona provincia"
            className="w-full"
          />
        </div>

        {/* Mes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1E40AF]" />
            Mes
          </label>
          <CustomSelect
            value={selectedMonth}
            onValueChange={setSelectedMonth}
            options={monthOptions}
            placeholder="Selecciona mes"
            className="w-full"
          />
        </div>

        {/* Modalidad de Carrera */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#1E40AF]" />
            Modalidad de Carrera
          </label>
          <CustomSelect
            value={selectedModality}
            onValueChange={setSelectedModality}
            options={modalityOptions}
            placeholder="Selecciona modalidad"
            className="w-full"
          />
        </div>

        {/* Distancia Carrera */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Distancia Carrera
          </label>
          <CustomSelect
            value={selectedDistance}
            onValueChange={setSelectedDistance}
            options={distanceOptions}
            placeholder="Selecciona distancia"
            className="w-full"
          />
        </div>

        {/* Search Button */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-transparent">Buscar</label>
          <Button 
            onClick={handleSearch}
            className="w-full h-12 bg-gradient-to-r from-[#1E40AF] to-[#059669] hover:from-[#1E40AF]/90 hover:to-[#059669]/90 text-white font-semibold"
          >
            <Search className="w-4 h-4 mr-2" />
            Buscar Carreras
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickSearchSection;
