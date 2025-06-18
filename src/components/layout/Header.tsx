
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, User, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AuthModalIntegrated from "@/components/auth/AuthModalIntegrated";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const { user, signOut } = useAuth();
  const location = useLocation();

  const openAuthModal = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-runner-blue-600 text-white p-2 rounded-lg">
                <Home className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Runners Home Exchange
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                to="/" 
                className={`text-gray-700 hover:text-runner-blue-600 font-medium ${
                  isActive('/') ? 'text-runner-blue-600' : ''
                }`}
              >
                Inicio
              </Link>
              
              {user && (
                <>
                  <Link 
                    to="/properties" 
                    className={`text-gray-700 hover:text-runner-blue-600 font-medium flex items-center ${
                      isActive('/properties') ? 'text-runner-blue-600' : ''
                    }`}
                  >
                    <Building2 className="h-4 w-4 mr-1" />
                    Mis Propiedades
                  </Link>
                  
                  <Link 
                    to="/profile" 
                    className={`text-gray-700 hover:text-runner-blue-600 font-medium flex items-center ${
                      isActive('/profile') ? 'text-runner-blue-600' : ''
                    }`}
                  >
                    <User className="h-4 w-4 mr-1" />
                    Mi Perfil
                  </Link>
                </>
              )}
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Hola, {user.user_metadata?.first_name || 'Runner'}
                  </span>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="text-gray-700 border-gray-300 hover:bg-gray-50"
                  >
                    Cerrar Sesión
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => openAuthModal("login")}
                    className="text-gray-700 hover:text-runner-blue-600"
                  >
                    Iniciar Sesión
                  </Button>
                  <Button
                    onClick={() => openAuthModal("register")}
                    className="bg-runner-blue-600 hover:bg-runner-blue-700 text-white"
                  >
                    Registrarse
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <nav className="flex flex-col space-y-4">
                <Link
                  to="/"
                  className={`text-gray-700 hover:text-runner-blue-600 font-medium ${
                    isActive('/') ? 'text-runner-blue-600' : ''
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Inicio
                </Link>
                
                {user && (
                  <>
                    <Link
                      to="/properties"
                      className={`text-gray-700 hover:text-runner-blue-600 font-medium flex items-center ${
                        isActive('/properties') ? 'text-runner-blue-600' : ''
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Mis Propiedades
                    </Link>
                    
                    <Link
                      to="/profile"
                      className={`text-gray-700 hover:text-runner-blue-600 font-medium flex items-center ${
                        isActive('/profile') ? 'text-runner-blue-600' : ''
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Mi Perfil
                    </Link>
                  </>
                )}

                <div className="pt-4 border-t border-gray-200">
                  {user ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Hola, {user.user_metadata?.first_name || 'Runner'}
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleSignOut}
                        className="w-full text-gray-700 border-gray-300 hover:bg-gray-50"
                      >
                        Cerrar Sesión
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          openAuthModal("login");
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-gray-700 hover:text-runner-blue-600"
                      >
                        Iniciar Sesión
                      </Button>
                      <Button
                        onClick={() => {
                          openAuthModal("register");
                          setIsMenuOpen(false);
                        }}
                        className="w-full bg-runner-blue-600 hover:bg-runner-blue-700 text-white"
                      >
                        Registrarse
                      </Button>
                    </div>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      <AuthModalIntegrated
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </>
  );
};

export default Header;
