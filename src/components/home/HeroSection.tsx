
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

interface HeroSectionProps {
  onAuthModal: (mode: "login" | "register") => void;
}

const HeroSection = ({ onAuthModal }: HeroSectionProps) => {
  const handleJoinCommunity = () => {
    console.log('HeroSection: Join community button clicked');
    // Disparar evento personalizado que Layout capturará
    window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { mode: 'register' } }));
  };

  const handleInitiateLogin = () => {
    console.log('HeroSection: Login button clicked');
    // Disparar evento personalizado que Layout capturará
    window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { mode: 'login' } }));
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/lovable-uploads/a989eba0-bb19-4efd-bcfc-3c1f8870d2cb.png')`
        }}
      />
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium border border-white/20">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                Conecta • Viaja • Corre
              </span>
            </div>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-blue-400">Conecta</span> • <span className="text-orange-400">Viaja</span> • <span className="text-blue-400">Corre</span>
          </h1>
          
          <p className="text-xl lg:text-2xl mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
            La plataforma que conecta corredores locales con corredores que viajan 
            a carreras, ofreciendo alojamiento auténtico y experiencia compartida 
            por gasto cero
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              onClick={handleJoinCommunity}
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 rounded-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              Únete a la Comunidad
            </Button>
            <Button 
              onClick={handleInitiateLogin}
              className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-4 rounded-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              Iniciar Sesión
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-1">500+</div>
              <div className="text-sm text-white/80">Runners activos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-1">50+</div>
              <div className="text-sm text-white/80">Ciudades</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-1">1000+</div>
              <div className="text-sm text-white/80">Experiencias</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
