
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/981505bd-2f25-4665-9b98-5496d5124ebe.png" 
              alt="Runners Home Exchange" 
              className="h-10 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-700 hover:text-runner-blue-600 font-medium transition-colors">
              Buscar Carreras
            </a>
            <a href="#" className="text-gray-700 hover:text-runner-blue-600 font-medium transition-colors">
              Ser Host
            </a>
            <a href="#" className="text-gray-700 hover:text-runner-blue-600 font-medium transition-colors">
              Comunidad
            </a>
            <a href="#" className="text-gray-700 hover:text-runner-blue-600 font-medium transition-colors">
              Cómo Funciona
            </a>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" className="text-gray-700 hover:text-runner-blue-600">
              Iniciar Sesión
            </Button>
            <Button className="runner-button-primary">
              Registrarse
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <a href="#" className="text-gray-700 hover:text-runner-blue-600 font-medium">
                Buscar Carreras
              </a>
              <a href="#" className="text-gray-700 hover:text-runner-blue-600 font-medium">
                Ser Host
              </a>
              <a href="#" className="text-gray-700 hover:text-runner-blue-600 font-medium">
                Comunidad
              </a>
              <a href="#" className="text-gray-700 hover:text-runner-blue-600 font-medium">
                Cómo Funciona
              </a>
              <div className="pt-4 space-y-2">
                <Button variant="outline" className="w-full">
                  Iniciar Sesión
                </Button>
                <Button className="w-full runner-button-primary">
                  Registrarse
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
