
import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { Trophy, User, Shield, Settings, BarChart, Trash, Home, Calendar } from "lucide-react";

interface ProfileLayoutProps {
  children: ReactNode;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const ProfileLayout = ({ children, activeSection, onSectionChange }: ProfileLayoutProps) => {
  const { progress } = useProfile();

  const sections = [
    { id: 'personal', label: 'Información Personal', icon: User },
    { id: 'runner', label: 'Perfil Runner', icon: Trophy },
    { id: 'roles', label: 'Rol en la Plataforma', icon: Shield },
    { id: 'properties', label: 'Mis Propiedades', icon: Home },
    { id: 'races', label: 'Mis Carreras', icon: Calendar },
    { id: 'verification', label: 'Verificación', icon: Settings },
    { id: 'stats', label: 'Logros y Estadísticas', icon: BarChart },
    { id: 'delete-account', label: 'Eliminar mi cuenta', icon: Trash },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Mi Perfil</h1>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Completitud del Perfil</h3>
              <Badge variant={progress === 100 ? "default" : "secondary"}>
                {progress}% Completo
              </Badge>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-gray-600 mt-2">
              {progress === 100 
                ? "¡Perfil completo! Ahora puedes disfrutar de todas las funciones."
                : "Completa tu perfil para obtener más visibilidad y confianza en la comunidad."
              }
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isDeleteSection = section.id === 'delete-account';
                  return (
                    <button
                      key={section.id}
                      onClick={() => onSectionChange?.(section.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                        activeSection === section.id
                          ? isDeleteSection 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-blue-100 text-blue-700'
                          : isDeleteSection
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;
