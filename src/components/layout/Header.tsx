import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AuthModalIntegrated from "@/components/auth/AuthModalIntegrated";
import NotificationBell from "@/components/notifications/NotificationBell";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleAuthClick = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const menuItems = [
    { name: "Inicio", path: "/" },
    { name: "Descubrir Carreras", path: "/discover" },
    { name: "Mis Propiedades", path: "/properties", requiresAuth: true },
    { name: "Mis Carreras", path: "/races", requiresAuth: true },
    { name: "Admin", path: "/admin", requiresAuth: true }, // Nueva ruta de admin
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/lovable-uploads/981505bd-2f25-4665-9b98-5496d5124ebe.png" alt="RunnersHEx" className="h-8 w-8" />
              <span className="font-bold text-xl text-blue-600">RunnersHEx</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {menuItems.map((item) => {
              if (item.requiresAuth && !user) return null;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname === item.path ? 'text-blue-600 border-b-2 border-blue-600' : ''
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <NotificationBell />
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/profile")}
                    className="flex items-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span>Perfil</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Salir</span>
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" onClick={() => handleAuthClick("login")}>
                  Iniciar Sesión
                </Button>
                <Button onClick={() => handleAuthClick("register")} className="bg-blue-600 hover:bg-blue-700">
                  Registrarse
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {user && <NotificationBell />}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                if (item.requiresAuth && !user) return null;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      location.pathname === item.path 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                );
              })}
              
              {user ? (
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Salir</span>
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleAuthClick("login");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start"
                  >
                    Iniciar Sesión
                  </Button>
                  <Button
                    onClick={() => {
                      handleAuthClick("register");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Registrarse
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
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
