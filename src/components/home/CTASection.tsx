
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CTASectionProps {
  onAuthModal: (mode: "login" | "register") => void;
}

const CTASection = ({ onAuthModal }: CTASectionProps) => {
  const { user } = useAuth();
  
  const handleJoinCommunity = () => {
    console.log('CTASection: Join community button clicked');
    
    // Check if user is already logged in
    if (user) {
      toast.info("Ya tienes una sesión activa. Cierra sesión primero para registrarte o iniciar sesión con otra cuenta.");
      return;
    }
    
    // Disparar evento personalizado que Layout capturará
    window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { mode: 'register' } }));
  };

  const handleExploreRaces = () => {
    console.log('CTASection: Explore races button clicked');
    
    // Check if user is already logged in
    if (user) {
      toast.info("Ya tienes una sesión activa. Cierra sesión primero para registrarte o iniciar sesión con otra cuenta.");
      return;
    }
    
    // Disparar evento personalizado que Layout capturará
    window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { mode: 'login' } }));
  };

  return (
    <section className="py-16 lg:py-24 bg-runner-gradient">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
          ¿Listo para tu próxima aventura?
        </h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Únete a nuestra comunidad de corredores apasionados y descubre una nueva forma de viajar y correr.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button 
            onClick={handleJoinCommunity}
            className="bg-white text-runner-blue-600 hover:bg-gray-100 text-lg px-8 py-4 font-semibold"
          >
            Únete a la Comunidad
          </Button>
          <Button 
            onClick={handleExploreRaces}
            className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-runner-blue-600 text-lg px-8 py-4 font-semibold"
          >
            Iniciar Sesión
          </Button>
        </div>
        <p className="text-xl text-white/90 max-w-2xl mx-auto font-medium">
          RunnersHEx no es solo alojamiento. Es otra forma de vivir el running.
        </p>
      </div>
    </section>
  );
};

export default CTASection;
