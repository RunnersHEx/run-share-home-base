
import { Button } from "@/components/ui/button";

interface MainHeaderProps {
  onAuthModal: (mode: "login" | "register") => void;
}

const MainHeader = ({ onAuthModal }: MainHeaderProps) => {
  console.log('MainHeader: Rendering with onAuthModal callback');

  const handleLoginClick = () => {
    console.log('MainHeader: Login button clicked');
    onAuthModal("login");
  };

  const handleRegisterClick = () => {
    console.log('MainHeader: Register button clicked');
    onAuthModal("register");
  };

  return (
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
            <Button
              variant="ghost"
              onClick={handleLoginClick}
              className="text-white hover:bg-white/20 border border-white/30"
            >
              Iniciar Sesión
            </Button>
            <Button
              onClick={handleRegisterClick}
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
