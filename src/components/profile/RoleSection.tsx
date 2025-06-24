
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { Home, Search } from "lucide-react";

const RoleSection = () => {
  const { profile } = useProfile();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rol en la Plataforma</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="mb-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">
              Comienza a desempeñar las funciones tanto de Host como Guest y disfrutar al máximo de la experiencia
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
            <div className="flex items-center space-x-2 mb-2">
              <Home className="h-5 w-5 text-blue-600" />
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-blue-700">Como Host</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Activo
                </Badge>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Ofrecer mi casa, carreras cercanas y conocimiento local a corredores que quieran venir a participar en ellas y visitar la zona
            </p>
          </div>
          
          <div className="border-2 border-orange-500 rounded-lg p-4 bg-orange-50">
            <div className="flex items-center space-x-2 mb-2">
              <Search className="h-5 w-5 text-orange-600" />
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-orange-700">Como Guest</span>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  Activo
                </Badge>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Buscar carreras que me atraigan, alojamiento cercano y experiencia local
            </p>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">Beneficios de Tener Ambos Roles</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Máxima flexibilidad para usar la plataforma</li>
            <li>• Acceso completo a todas las funciones</li>
            <li>• Oportunidades tanto para alojar como para viajar</li>
            <li>• Mayor potencial de conexiones en la comunidad</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleSection;
