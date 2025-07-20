
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { 
  User, 
  Heart, 
  UserCheck, 
  Home,
  Trophy,
  Shield, 
  BarChart3, 
  Trash2,
  Calendar,
  CreditCard,
  Coins,
  Star
} from "lucide-react";

interface ProfileLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const ProfileLayout = ({ children, activeSection, onSectionChange }: ProfileLayoutProps) => {
  const { profile, progress } = useProfile();
  const { profile: authProfile, user } = useAuth();
  
  // ✅ SMART FALLBACK: Use AuthContext data when useProfile has no meaningful data
  const hasValidProfileData = profile && profile.id && (profile.first_name || profile.last_name || profile.email);
  const displayProfile = hasValidProfileData ? profile : authProfile;
  const displayName = displayProfile?.first_name && displayProfile?.last_name 
    ? `${displayProfile.first_name} ${displayProfile.last_name}`
    : user?.email?.split('@')[0] || 'Usuario';
  const displayEmail = displayProfile?.email || user?.email || '';
  
  console.log('ProfileLayout: Smart fallback logic', {
    useProfileExists: !!profile,
    useProfileHasValidData: hasValidProfileData,
    authProfileExists: !!authProfile,
    usingAuthFallback: !hasValidProfileData && !!authProfile,
    displayName,
    verificationStatus: displayProfile?.verification_status
  });

  const sections = [
    { id: "personal", label: "Información Personal", icon: User },
    { id: "runner", label: "Perfil Runner", icon: Heart },
    { id: "roles", label: "Roles", icon: UserCheck },
    { id: "properties", label: "Mi Propiedad", icon: Home },
    { id: "races", label: "Mis Carreras", icon: Trophy },
    { id: "bookings", label: "Solicitudes", icon: Calendar },
    { id: "reviews", label: "Valoraciones", icon: Star },
    { id: "subscription", label: "Mi Suscripción", icon: CreditCard },
    { id: "points", label: "Sistema de Puntos", icon: Coins },
    { id: "verification", label: "Verificación", icon: Shield },
    { id: "stats", label: "Estadísticas", icon: BarChart3 },
    { id: "delete-account", label: "Eliminar Cuenta", icon: Trash2 },
  ];

  const getVerificationBadge = () => {
    // ✅ DEBUG: Log verification status in ProfileLayout
    console.log('ProfileLayout: getVerificationBadge called', {
      useProfileExists: !!profile,
      authProfileExists: !!authProfile,
      displayProfileExists: !!displayProfile,
      verificationStatus: displayProfile?.verification_status,
      profileId: displayProfile?.id
    });
    
    switch (displayProfile?.verification_status) {
      case 'verified':
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Verificado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Rechazado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pendiente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Sin verificar</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              {/* Profile Header */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                  {displayProfile?.first_name?.charAt(0) || displayName.charAt(0) || 'U'}{displayProfile?.last_name?.charAt(0) || displayName.charAt(1) || ''}
                </div>
                <h3 className="font-semibold text-lg">
                  {displayName}
                </h3>
                <p className="text-sm text-gray-600">{displayEmail}</p>
                <div className="mt-2">
                  {getVerificationBadge()}
                </div>
                {/* ✅ DEBUG: Profile source indicator */}
                <div className="mt-1 text-xs text-gray-500">
                  Fuente: {hasValidProfileData ? 'useProfile' : authProfile ? 'AuthContext' : 'ninguna'}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progreso del perfil</span>
                  <span className="text-sm text-gray-600">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <Button
                      key={section.id}
                      variant={activeSection === section.id ? "default" : "ghost"}
                      className={`w-full justify-start text-sm ${
                        activeSection === section.id 
                          ? "bg-blue-600 text-white" 
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => onSectionChange(section.id)}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {section.label}
                    </Button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;
