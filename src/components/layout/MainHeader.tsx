
import { Button } from "@/components/ui/button";

interface MainHeaderProps {
  onAuthModal: (mode: "login" | "register") => void;
}

const MainHeader = ({ onAuthModal }: MainHeaderProps) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo más grande en esquina superior izquierda */}
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/981505bd-2f25-4665-9b98-5496d5124ebe.png" 
              alt="Runners Home Exchange" 
              className="h-20 w-auto object-contain"
            />
          </div>

          {/* Botones de autenticación en la esquina superior derecha */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => onAuthModal("login")}
              className="text-white hover:bg-white/20 border border-white/30"
            >
              Iniciar Sesión
            </Button>
            <Button
              onClick={() => onAuthModal("register")}
              className="bg-runner-orange-500 hover:bg-runner-orange-600 text-white font-semibold"
            >
              Únete a la Comunidad
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MainHeader;
