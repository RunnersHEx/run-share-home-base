
import { Button } from "@/components/ui/button";
import MainHeader from "@/components/layout/MainHeader";

interface HeroSectionProps {
  onAuthModal: (mode: "login" | "register") => void;
}

const HeroSection = ({ onAuthModal }: HeroSectionProps) => {
  return (
    <section className="relative overflow-hidden min-h-screen">
      {/* Imagen de fondo */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/lovable-uploads/2e278f92-53fa-4ccf-b631-a95da538218b.png')`
        }}
      >
        {/* Overlay para mejorar la legibilidad del texto */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
      
      {/* Header con logo y botones */}
      <MainHeader onAuthModal={onAuthModal} />
      
      {/* Contenido principal */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 animate-fade-in drop-shadow-2xl">
              <span className="text-runner-blue-500">Conecta</span> • <span className="text-runner-orange-500">Viaja</span> • <span className="bg-gradient-to-r from-blue-500 to-orange-500 bg-clip-text text-transparent">Corre</span>
            </h1>
            <p className="text-xl lg:text-2xl text-white mb-8 animate-fade-in drop-shadow-lg font-medium max-w-3xl mx-auto leading-relaxed">
              La plataforma que conecta corredores locales con corredores que viajan a carreras,<br />
              ofreciendo alojamiento auténtico y experiencia compartida por gasto cero
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Button 
                onClick={() => onAuthModal("register")}
                className="bg-gradient-to-r from-blue-500/80 to-orange-500/80 hover:from-blue-600/90 hover:to-orange-600/90 text-white text-lg px-8 py-4 font-semibold shadow-2xl backdrop-blur-sm border-0"
              >
                Únete a la Comunidad
              </Button>
              <Button 
                onClick={() => onAuthModal("login")}
                className="bg-gradient-to-r from-blue-500/80 to-orange-500/80 hover:from-blue-600/90 hover:to-orange-600/90 text-white text-lg px-8 py-4 font-semibold shadow-2xl backdrop-blur-sm border-0"
              >
                Iniciar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
