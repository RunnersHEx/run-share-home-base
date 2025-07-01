
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AuthModalIntegrated from "@/components/auth/AuthModalIntegrated";
import UserProfile from "@/components/common/UserProfile";

const Header = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const handleAuthClick = (mode: "login" | "register") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <img 
                src="/lovable-uploads/981505bd-2f25-4665-9b98-5496d5124ebe.png" 
                alt="RunnersHEx" 
                className="h-8 w-8"
              />
              <span className="font-bold text-xl text-gray-900">RunnersHEx</span>
            </div>

            {/* Navigation - Solo para usuarios autenticados */}
            {user && (
              <nav className="hidden md:flex items-center space-x-8">
                <button
                  onClick={() => navigate("/")}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Inicio
                </button>
                <button
                  onClick={() => navigate("/discover")}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Descubrir Carreras
                </button>
                {isAdmin && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="text-red-600 hover:text-red-700 font-medium transition-colors"
                  >
                    Panel Admin
                  </button>
                )}
              </nav>
            )}

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {user ? (
                <UserProfile />
              ) : (
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    onClick={() => handleAuthClick("login")}
                    className="text-gray-700 hover:text-blue-600"
                  >
                    Iniciar Sesión
                  </Button>
                  <Button
                    onClick={() => handleAuthClick("register")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Únete a la Comunidad
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModalIntegrated
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </>
  );
};

export default Header;
