
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, Shield, Home, Trophy, Calendar, Search } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import NotificationBell from "../notifications/NotificationBell";
import AuthModalIntegrated from "../auth/AuthModalIntegrated";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, signOut, loading } = useAuth();
  const { isAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  console.log('Layout: Current state:', {
    hasUser: !!user,
    userEmail: user?.email || 'none',
    loading,
    isAdmin,
    showAuthModal
  });

  const handleAuthModal = (mode: "login" | "register") => {
    console.log('Layout: Opening auth modal with mode:', mode);
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleSignOut = async () => {
    console.log('Layout: Initiating sign out process');
    try {
      await signOut();
      console.log('Layout: Sign out successful');
      navigate("/");
    } catch (error) {
      console.error('Layout: Sign out error:', error);
      toast.error("Error al cerrar sesión");
    }
  };

  const handleNavigation = (path: string, section?: string) => {
    if (section) {
      navigate(path, { state: { activeSection: section } });
    } else {
      navigate(path);
    }
  };

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const isHomePage = location.pathname === '/';

  // Cerrar modal automáticamente cuando el usuario se autentica
  useEffect(() => {
    if (user && showAuthModal && !loading) {
      console.log('Layout: User authenticated, closing auth modal');
      const timer = setTimeout(() => {
        setShowAuthModal(false);
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [user, showAuthModal, loading]);

  if (loading) {
    return (
      <div className="min-h-screen">
        {!isHomePage && (
          <header className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img 
                    src="/lovable-uploads/981505bd-2f25-4665-9b98-5496d5124ebe.png" 
                    alt="Runners Home Exchange" 
                    className="h-10 w-auto object-contain"
                  />
                </div>
                <div className="text-gray-500">Cargando...</div>
              </div>
            </div>
          </header>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {!isHomePage && (
        <header className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                <img 
                  src="/lovable-uploads/981505bd-2f25-4665-9b98-5496d5124ebe.png" 
                  alt="Runners Home Exchange" 
                  className="h-10 w-auto object-contain"
                />
              </div>

              <nav className="hidden md:flex items-center space-x-8">
                <button 
                  onClick={() => navigate('/')}
                  className="text-gray-700 hover:text-runner-blue-600 font-medium transition-colors"
                >
                  <Home className="h-4 w-4 inline mr-2" />
                  Inicio
                </button>
                <button 
                  onClick={() => navigate('/discover')}
                  className="text-gray-700 hover:text-runner-blue-600 font-medium transition-colors"
                >
                  <Search className="h-4 w-4 inline mr-2" />
                  Descubrir Carreras
                </button>
                {user && (
                  <>
                    <button 
                      onClick={() => navigate('/bookings')}
                      className="text-gray-700 hover:text-runner-blue-600 font-medium transition-colors"
                    >
                      <Calendar className="h-4 w-4 inline mr-2" />
                      Mis Reservas
                    </button>
                    <button 
                      onClick={() => navigate('/races')}
                      className="text-gray-700 hover:text-runner-blue-600 font-medium transition-colors"
                    >
                      <Trophy className="h-4 w-4 inline mr-2" />
                      Mis Carreras
                    </button>
                  </>
                )}
              </nav>

              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    <NotificationBell />
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={user.user_metadata?.avatar_url} 
                              alt="Avatar"
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-blue-600 text-white">
                              {getInitials(user.email || "")}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {user.user_metadata?.first_name || user.email?.split('@')[0]}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleNavigation("/profile")}>
                          <User className="mr-2 h-4 w-4" />
                          <span>Mi Perfil</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigation("/profile", "properties")}>
                          <Home className="mr-2 h-4 w-4" />
                          <span>Mis Propiedades</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigation("/profile", "races")}>
                          <Trophy className="mr-2 h-4 w-4" />
                          <span>Mis Carreras</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {isAdmin && (
                          <>
                            <DropdownMenuItem onClick={() => navigate('/admin')}>
                              <Shield className="mr-2 h-4 w-4" />
                              <span>Panel Admin</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem onClick={handleSignOut}>
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Cerrar sesión</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handleAuthModal("login")}
                    >
                      Iniciar Sesión
                    </Button>
                    <Button
                      onClick={() => handleAuthModal("register")}
                      className="bg-runner-blue-600 hover:bg-runner-blue-700"
                    >
                      Únete a la Comunidad
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {children}

      {!isHomePage && showAuthModal && (
        <AuthModalIntegrated
          mode={authMode}
          isOpen={showAuthModal}
          onClose={() => {
            console.log('Layout: Manually closing auth modal');
            setShowAuthModal(false);
          }}
          onModeChange={setAuthMode}
        />
      )}
    </div>
  );
};

export default Layout;
