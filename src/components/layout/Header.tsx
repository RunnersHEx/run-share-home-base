
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "../notifications/NotificationBell";
import UserProfile from "../common/UserProfile";
import AuthModalIntegrated from "../auth/AuthModalIntegrated";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

const Header = () => {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const handleAuthModal = (mode: "login" | "register") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Sesión cerrada correctamente");
    } catch (error) {
      toast.error("Error al cerrar sesión");
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/981505bd-2f25-4665-9b98-5496d5124ebe.png" 
                alt="Runners Home Exchange" 
                className="h-10 w-auto"
              />
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/" className="text-gray-700 hover:text-runner-blue-600 font-medium">
                Inicio
              </a>
              <a href="/discover" className="text-gray-700 hover:text-runner-blue-600 font-medium">
                Descubrir Carreras
              </a>
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <NotificationBell />
                  <UserProfile />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </Button>
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
                    Registrarse
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showAuthModal && (
        <AuthModalIntegrated
          mode={authMode}
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onModeChange={setAuthMode}
        />
      )}
    </>
  );
};

export default Header;
