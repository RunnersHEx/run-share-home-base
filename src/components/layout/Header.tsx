
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import UserProfile from "@/components/common/UserProfile";
import AuthModalIntegrated from "@/components/auth/AuthModalIntegrated";

const Header = () => {
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const openAuthModal = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src="/lovable-uploads/981505bd-2f25-4665-9b98-5496d5124ebe.png" 
            alt="Runners Home Exchange" 
            className="h-8 w-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/carreras" className="text-gray-600 hover:text-gray-900 transition-colors">
            Carreras
          </Link>
          <Link to="/hosts" className="text-gray-600 hover:text-gray-900 transition-colors">
            Hosts
          </Link>
          <Link to="/como-funciona" className="text-gray-600 hover:text-gray-900 transition-colors">
            ¿Cómo funciona?
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link to="/profile">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  Mi Perfil
                </Button>
              </Link>
              <UserProfile />
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                onClick={() => openAuthModal("login")}
                className="text-gray-600 hover:text-gray-900"
              >
                Iniciar Sesión
              </Button>
              <Button 
                onClick={() => openAuthModal("register")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Registrarse
              </Button>
            </>
          )}
        </div>
      </div>

      <AuthModalIntegrated 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </header>
  );
};

export default Header;
