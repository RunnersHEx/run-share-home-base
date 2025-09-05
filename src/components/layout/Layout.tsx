
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useVerification } from "@/hooks/useVerification";
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
import { User, Settings, LogOut, Shield, Home, Trophy, Calendar, Search, MessageCircle, Bell, FileText } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import NotificationBell from "../notifications/NotificationBell";
import AuthModalIntegrated from "../auth/AuthModalIntegrated";
import VerificationRequiredModal from "../auth/VerificationRequiredModal";
import VerificationRouteGuard from "../verification/VerificationRouteGuard";
import VerificationGuard from "../verification/VerificationGuard";
import { UnreadBadge } from "@/components/messaging";
import CookieBanner from "@/components/legal/CookieBanner";
import Footer from "./Footer";


interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, signOut, loading, profile } = useAuth();
  const { isAdmin } = useAdminAuth();
  const { showVerificationModal, isLoading: verificationLoading } = useVerification();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [showVerificationModalState, setShowVerificationModalState] = useState(false);
  const [recentlyUploadedDocs, setRecentlyUploadedDocs] = useState(false);

  const isHomePage = location.pathname === '/';
  const isProfilePage = location.pathname === '/profile';

  // Automatically close auth modal when user logs in successfully
  useEffect(() => {
    if (user && showAuthModal) {
      console.log('Layout: User detected, closing auth modal');
      setShowAuthModal(false);
    }
  }, [user, showAuthModal]);

  // Show verification modal for authenticated users who need verification
  useEffect(() => {
    // Only show modal if:
    // 1. User is authenticated
    // 2. Verification data is loaded (not loading)
    // 3. Verification is actually required
    // 4. Not on the profile page
    // 5. Profile data exists (prevents flash during profile loading)
    // 6. User hasn't recently uploaded documents (prevents modal after upload)
    if (user && !verificationLoading && showVerificationModal && !isProfilePage && profile && !recentlyUploadedDocs) {
      // Add a small delay to ensure all data is fully loaded and prevent flash
      const timer = setTimeout(() => {
        setShowVerificationModalState(true);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setShowVerificationModalState(false);
    }
  }, [user, verificationLoading, showVerificationModal, isProfilePage, profile, recentlyUploadedDocs]);

  // Listen for document upload events to prevent modal from showing immediately after upload
  useEffect(() => {
    const handleVerificationUpload = (event: CustomEvent) => {
      if (event.detail?.documentsUploaded) {
        setRecentlyUploadedDocs(true);
        // Reset after 3 seconds to allow the verification status to update properly
        setTimeout(() => {
          setRecentlyUploadedDocs(false);
        }, 3000);
      }
    };

    window.addEventListener('verificationStatusChanged', handleVerificationUpload as EventListener);
    
    return () => {
      window.removeEventListener('verificationStatusChanged', handleVerificationUpload as EventListener);
    };
  }, []);

  const handleAuthModal = (mode: "login" | "register") => {
    // Check if user is already logged in
    if (user) {
      toast.info("Ya tienes una sesión activa. Cierra sesión primero para registrarte o iniciar sesión con otra cuenta.");
      return;
    }
    
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Escuchar eventos personalizados de los botones de la homepage
  useEffect(() => {
    const handleOpenAuthModal = (event: CustomEvent) => {
      const { mode } = event.detail;
      handleAuthModal(mode);
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal as EventListener);
    
    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal as EventListener);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
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

  if (loading) {
    console.log('Layout: Rendering loading state');
    return (
      <div className="min-h-screen">
        {/* Header para homepage durante loading */}
        {isHomePage ? (
          <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img 
                    src="/lovable-uploads/981505bd-2f25-4665-9b98-5496d5124ebe.png" 
                    alt="Runners Home Exchange" 
                    className="h-20 w-auto object-contain"
                  />
                </div>
                <div className="text-white">Cargando...</div>
              </div>
            </div>
          </header>
        ) : (
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
      <VerificationRouteGuard>
        <div className="mb-16">
          {children}
        </div>
      </VerificationRouteGuard>
      
      <Footer />

      {showAuthModal && (
        <AuthModalIntegrated
          mode={authMode}
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onModeChange={setAuthMode}
        />
      )}
      
      {showVerificationModalState && (
        <VerificationRequiredModal
          isOpen={showVerificationModalState}
          onClose={() => setShowVerificationModalState(false)}
        />
      )}
      
      <CookieBanner />
    </div>
    );
  }

  console.log('Layout: Rendering main layout');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header condicional según la página */}
      {isHomePage ? (
        // Header transparente para homepage
        <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img 
                  src="/lovable-uploads/981505bd-2f25-4665-9b98-5496d5124ebe.png" 
                  alt="Runners Home Exchange" 
                  className="h-20 w-auto object-contain"
                />
              </div>

              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    <NotificationBell />
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                          <Avatar className="h-8 w-8" key={profile?.profile_image_url || 'default-nav-avatar'}>
                            <AvatarImage 
                              src={profile?.profile_image_url || user.user_metadata?.avatar_url} 
                              alt="Avatar"
                              className="object-cover"
                              key={profile?.profile_image_url || 'default-nav-image'}
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
                        {location.pathname !== '/profile' && (
                          <VerificationGuard showToast={false} fallback={
                            <DropdownMenuItem disabled className="opacity-50">
                              <Search className="mr-2 h-4 w-4" />
                              <span>Descubrir Carreras (Verificación requerida)</span>
                            </DropdownMenuItem>
                          }>
                            <DropdownMenuItem onClick={() => handleNavigation("/discover")}>
                              <Search className="mr-2 h-4 w-4" />
                              <span>Descubrir Carreras</span>
                            </DropdownMenuItem>
                          </VerificationGuard>
                        )}
                        <VerificationGuard showToast={false} fallback={
                          <DropdownMenuItem disabled className="opacity-50">
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>Mis Reservas (Verificación requerida)</span>
                          </DropdownMenuItem>
                        }>
                          <DropdownMenuItem onClick={() => handleNavigation("/bookings")}>
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>Mis Reservas</span>
                          </DropdownMenuItem>
                        </VerificationGuard>
                        <VerificationGuard showToast={false} fallback={
                          <DropdownMenuItem disabled className="opacity-50">
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Solicitudes (Verificación requerida)</span>
                          </DropdownMenuItem>
                        }>
                          <DropdownMenuItem onClick={() => handleNavigation("/profile", "bookings")}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Solicitudes</span>
                          </DropdownMenuItem>
                        </VerificationGuard>
                        <VerificationGuard showToast={false} fallback={
                          <DropdownMenuItem disabled className="opacity-50">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            <span>Mensajes (Verificación requerida)</span>
                          </DropdownMenuItem>
                        }>
                          <DropdownMenuItem onClick={() => handleNavigation("/messages")} className="relative">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            <span>Mensajes</span>
                            <UnreadBadge className="absolute -top-1 -right-1" size="sm" />
                          </DropdownMenuItem>
                        </VerificationGuard>
                        <VerificationGuard showToast={false} fallback={
                          <DropdownMenuItem disabled className="opacity-50">
                            <Trophy className="mr-2 h-4 w-4" />
                            <span>Mis Carreras (Verificación requerida)</span>
                          </DropdownMenuItem>
                        }>
                          <DropdownMenuItem onClick={() => handleNavigation("/races")}>
                            <Trophy className="mr-2 h-4 w-4" />
                            <span>Mis Carreras</span>
                          </DropdownMenuItem>
                        </VerificationGuard>
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
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        console.log('Layout: Homepage login button clicked');
                        handleAuthModal("login");
                      }}
                      className="text-white hover:bg-white/20 border border-white/30"
                    >
                      Iniciar Sesión
                    </Button>
                    <Button
                      onClick={() => {
                        console.log('Layout: Homepage register button clicked');
                        handleAuthModal("register");
                      }}
                      className="bg-runner-orange-500 hover:bg-runner-orange-600 text-white font-semibold"
                    >
                      Únete a la Comunidad
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      ) : (
        // Header normal para otras páginas
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
                {location.pathname !== '/profile' && (
                  <VerificationGuard
                    toastMessage="Completa la verificación de identidad para descubrir carreras"
                    redirectToProfile={true}
                  >
                    <button 
                      onClick={() => navigate('/discover')}
                      className="text-gray-700 hover:text-runner-blue-600 font-medium transition-colors"
                    >
                      <Search className="h-4 w-4 inline mr-2" />
                      Descubrir Carreras
                    </button>
                  </VerificationGuard>
                )}
                {user && (
                  <>
                    <VerificationGuard
                      toastMessage="Completa la verificación de identidad para ver tus reservas"
                      redirectToProfile={true}
                    >
                      <button 
                        onClick={() => navigate('/bookings')}
                        className="text-gray-700 hover:text-runner-blue-600 font-medium transition-colors"
                      >
                        <Calendar className="h-4 w-4 inline mr-2" />
                        Mis Reservas
                      </button>
                    </VerificationGuard>
                    <VerificationGuard
                      toastMessage="Completa la verificación de identidad para gestionar solicitudes"
                      redirectToProfile={true}
                    >
                      <button 
                        onClick={() => handleNavigation('/profile', 'bookings')}
                        className="text-gray-700 hover:text-runner-blue-600 font-medium transition-colors"
                      >
                        <FileText className="h-4 w-4 inline mr-2" />
                        Solicitudes
                      </button>
                    </VerificationGuard>
                    <VerificationGuard
                      toastMessage="Completa la verificación de identidad para acceder a mensajes"
                      redirectToProfile={true}
                    >
                      <button 
                        onClick={() => navigate('/messages')}
                        className="text-gray-700 hover:text-runner-blue-600 font-medium transition-colors relative"
                      >
                        <MessageCircle className="h-4 w-4 inline mr-2" />
                        Mensajes
                        <UnreadBadge className="absolute -top-2 -right-2" size="sm" />
                      </button>
                    </VerificationGuard>
                    <VerificationGuard
                      toastMessage="Completa la verificación de identidad para gestionar tus carreras"
                      redirectToProfile={true}
                    >
                      <button 
                        onClick={() => navigate('/races')}
                        className="text-gray-700 hover:text-runner-blue-600 font-medium transition-colors"
                      >
                        <Trophy className="h-4 w-4 inline mr-2" />
                        Mis Carreras
                      </button>
                    </VerificationGuard>
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
                          <Avatar className="h-8 w-8" key={profile?.profile_image_url || 'default-nav-avatar-2'}>
                            <AvatarImage 
                              src={profile?.profile_image_url || user.user_metadata?.avatar_url} 
                              alt="Avatar"
                              className="object-cover"
                              key={profile?.profile_image_url || 'default-nav-image-2'}
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
                        <VerificationGuard showToast={false} fallback={
                          <DropdownMenuItem disabled className="opacity-50">
                            <Home className="mr-2 h-4 w-4" />
                            <span>Mis Propiedades (Verificación requerida)</span>
                          </DropdownMenuItem>
                        }>
                          <DropdownMenuItem onClick={() => handleNavigation("/profile", "properties")}>
                            <Home className="mr-2 h-4 w-4" />
                            <span>Mis Propiedades</span>
                          </DropdownMenuItem>
                        </VerificationGuard>
                        <VerificationGuard showToast={false} fallback={
                          <DropdownMenuItem disabled className="opacity-50">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            <span>Mensajes (Verificación requerida)</span>
                          </DropdownMenuItem>
                        }>
                          <DropdownMenuItem onClick={() => handleNavigation("/messages")} className="relative">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            <span>Mensajes</span>
                            <UnreadBadge className="absolute -top-1 -right-1" size="sm" />
                          </DropdownMenuItem>
                        </VerificationGuard>
                        <VerificationGuard showToast={false} fallback={
                          <DropdownMenuItem disabled className="opacity-50">
                            <Trophy className="mr-2 h-4 w-4" />
                            <span>Mis Carreras (Verificación requerida)</span>
                          </DropdownMenuItem>
                        }>
                          <DropdownMenuItem onClick={() => handleNavigation("/profile", "races")}>
                            <Trophy className="mr-2 h-4 w-4" />
                            <span>Mis Carreras</span>
                          </DropdownMenuItem>
                        </VerificationGuard>
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

      <main className="flex-grow mb-16">
        {children}
      </main>

      <Footer />

      {showAuthModal && (
        <AuthModalIntegrated
          mode={authMode}
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onModeChange={setAuthMode}
        />
      )}
      
      {showVerificationModalState && (
        <VerificationRequiredModal
          isOpen={showVerificationModalState}
          onClose={() => setShowVerificationModalState(false)}
        />
      )}
      
      <CookieBanner />
    </div>
  );
};

export default Layout;
