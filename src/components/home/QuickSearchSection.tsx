
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Calendar, Trophy } from "lucide-react";
import { RaceFilters } from "@/types/race";

const QuickSearchSection = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
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

  const handleSearch = () => {
    // Build filters object
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
    console.log('QuickSearch: Search query:', searchQuery);

    // Navigate to discover page with filters as URL parameters
    const searchParams = new URLSearchParams();
    
    if (searchQuery) {
      searchParams.set('q', searchQuery);
    }
    
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
    <div className="bg-white rounded-2xl shadow-2xl p-8 -mt-12 relative z-10 mx-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Encuentra tu próxima aventura
        </h2>
        <p className="text-gray-600">
          Filtra por destino, fechas y características para descubrir carreras únicas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Destino */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1E40AF]" />
            Destino
          </label>
          <Select value={selectedProvince} onValueChange={setSelectedProvince}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Valencia" />
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

        {/* Mes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1E40AF]" />
            Mes
          </label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Enero" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Enero</SelectItem>
              <SelectItem value="2">Febrero</SelectItem>
              <SelectItem value="3">Marzo</SelectItem>
              <SelectItem value="4">Abril</SelectItem>
              <SelectItem value="5">Mayo</SelectItem>
              <SelectItem value="6">Junio</SelectItem>
              <SelectItem value="7">Julio</SelectItem>
              <SelectItem value="8">Agosto</SelectItem>
              <SelectItem value="9">Septiembre</SelectItem>
              <SelectItem value="10">Octubre</SelectItem>
              <SelectItem value="11">Noviembre</SelectItem>
              <SelectItem value="12">Diciembre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Modalidad de Carrera */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#1E40AF]" />
            Modalidad de Carrera
          </label>
          <Select value={selectedModality} onValueChange={setSelectedModality}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Asfalto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="road">Asfalto</SelectItem>
              <SelectItem value="trail">Trail/Montaña</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Distancia Carrera */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Distancia Carrera
          </label>
          <Select value={selectedDistance} onValueChange={setSelectedDistance}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="10K" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ultra">Ultra</SelectItem>
              <SelectItem value="marathon">Maratón</SelectItem>
              <SelectItem value="half_marathon">Media Maratón</SelectItem>
              <SelectItem value="20k">20K</SelectItem>
              <SelectItem value="15k">15K</SelectItem>
              <SelectItem value="10k">10K</SelectItem>
              <SelectItem value="5k">5K</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Search Bar Alternative */}
      <div className="border-t pt-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="O busca por nombre de carrera, ciudad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-lg border-gray-300 focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default QuickSearchSection;
