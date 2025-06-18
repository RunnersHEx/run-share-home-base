
import { Button } from "@/components/ui/button";

interface CTASectionProps {
  onAuthModal: (mode: "login" | "register") => void;
}

const CTASection = ({ onAuthModal }: CTASectionProps) => {
  return (
    <section className="py-16 lg:py-24 bg-runner-gradient">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
          ¿Listo para tu próxima aventura?
        </h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Únete a nuestra comunidad de corredores apasionados y descubre una nueva forma de viajar y correr.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => onAuthModal("register")}
            className="bg-white text-runner-blue-600 hover:bg-gray-100 text-lg px-8 py-4 font-semibold"
          >
            Crear Cuenta Gratis
          </Button>
          <Button 
            className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-runner-blue-600 text-lg px-8 py-4 font-semibold"
          >
            Explorar Carreras
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
