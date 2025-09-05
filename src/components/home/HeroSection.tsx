
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStatsCount } from "@/hooks/useStatsCount";
import { toast } from "sonner";

interface HeroSectionProps {
  onAuthModal: (mode: "login" | "register") => void;
}

const HeroSection = ({ onAuthModal }: HeroSectionProps) => {
  const { user } = useAuth();
  const { stats, loading: statsLoading, error: statsError } = useStatsCount();
  
  const handleJoinCommunity = () => {
    console.log('HeroSection: Join community button clicked');
    
    // Check if user is already logged in
    if (user) {
      toast.info("Ya tienes una sesión activa. Cierra sesión primero para registrarte o iniciar sesión con otra cuenta.");
      return;
    }
    
    // Disparar evento personalizado que Layout capturará
    window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { mode: 'register' } }));
  };

  const handleInitiateLogin = () => {
    console.log('HeroSection: Login button clicked');
    
    // Check if user is already logged in
    if (user) {
      toast.info("Ya tienes una sesión activa. Cierra sesión primero para registrarte o iniciar sesión con otra cuenta.");
      return;
    }
    
    // Disparar evento personalizado que Layout capturará
    window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { mode: 'login' } }));
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-runner-gradient">
      {/* Background Image */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url('/lovable-uploads/hero.png')`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Dark Overlay for better text visibility */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
            <span style={{ color: '#60A5FA' }}>Conecta</span>
            <span className="text-white"> · </span>
            <span style={{ color: '#fb923c' }}>Viaja</span>
            <span className="text-white"> · </span>
            <span style={{ color: '#60A5FA' }}>Corre</span>
          </h1>
          
          <p className="text-xl lg:text-2xl mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
            La plataforma que conecta corredores locales con corredores que viajan 
            a carreras, ofreciendo alojamiento auténtico y experiencia compartida 
            por gasto cero
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              onClick={handleJoinCommunity}
              className="bg-runner-blue-600 hover:bg-runner-blue-700 text-white text-lg px-8 py-4 rounded-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              Únete a la Comunidad
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              onClick={handleInitiateLogin}
              className="bg-runner-orange-500 hover:bg-runner-orange-600 text-white text-lg px-8 py-4 rounded-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              Iniciar Sesión
              <Play className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1" style={{ color: '#fb923c' }}>
                {statsLoading ? "..." : (statsError ? "0" : stats.activeUsers)}
              </div>
              <div className="text-sm text-white/80">Usuarios Activos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1" style={{ color: '#fb923c' }}>
                {statsLoading ? "..." : (statsError ? "0" : stats.locations)}
              </div>
              <div className="text-sm text-white/80">Ubicaciones</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1" style={{ color: '#fb923c' }}>
                {statsLoading ? "..." : (statsError ? "0" : stats.careers)}
              </div>
              <div className="text-sm text-white/80">Carreras</div>
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
