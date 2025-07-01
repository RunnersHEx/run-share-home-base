
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onAuthModal: (mode: "login" | "register") => void;
}

const HeroSection = ({ onAuthModal }: HeroSectionProps) => {
  return (
    <section className="relative overflow-hidden page-gradient">
      <div className="absolute inset-0 bg-runner-gradient opacity-5"></div>
      <div className="container mx-auto px-4 py-16 lg:py-24 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <img 
              src="/lovable-uploads/981505bd-2f25-4665-9b98-5496d5124ebe.png" 
              alt="Runners Home Exchange" 
              className="h-40 w-auto object-contain"
            />
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 animate-fade-in">
            Conecta • Viaja • <span className="bg-runner-gradient bg-clip-text text-transparent">Corre</span>
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 mb-8 animate-fade-in">
            La plataforma que conecta corredores locales con corredores que viajan a carreras, 
            ofreciendo alojamiento auténtico y experiencia compartida por cero gasto
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Button 
              onClick={() => onAuthModal("register")}
              className="runner-button-primary text-lg px-8 py-4"
            >
              Únete a la Comunidad
            </Button>
            <Button 
              onClick={() => onAuthModal("login")}
              className="runner-button-secondary text-lg px-8 py-4"
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
