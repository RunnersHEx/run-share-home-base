
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthModalIntegrated } from "@/components/auth/AuthModalIntegrated";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, User, Home, Trophy, MapPin } from "lucide-react";

const Header = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const getInitials = (user: any) => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name.charAt(0)}${user.user_metadata.last_name.charAt(0)}`;
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-[#1E40AF] text-white p-2 rounded-lg">
              <Trophy className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Runners Home Exchange
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/")
                  ? "bg-[#1E40AF] text-white"
                  : "text-gray-700 hover:text-[#1E40AF] hover:bg-gray-100"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Inicio</span>
            </Link>

            {user && (
              <>
                <Link
                  to="/properties"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/properties")
                      ? "bg-[#1E40AF] text-white"
                      : "text-gray-700 hover:text-[#1E40AF] hover:bg-gray-100"
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Mis Propiedades</span>
                </Link>

                <Link
                  to="/races"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/races")
                      ? "bg-[#1E40AF] text-white"
                      : "text-gray-700 hover:text-[#1E40AF] hover:bg-gray-100"
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>Mis Carreras</span>
                </Link>
              </>
            )}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#1E40AF] text-white text-sm">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Mi Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => setAuthModalOpen(true)}
                className="bg-[#1E40AF] hover:bg-[#1E40AF]/90"
              >
                Iniciar Sesión
              </Button>
            )}
          </div>
        </div>
      </div>

      <AuthModalIntegrated 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
    </header>
  );
};

export default Header;
