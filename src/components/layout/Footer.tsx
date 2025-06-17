
import { MapPin, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <img 
              src="/lovable-uploads/a989eba0-bb19-4efd-bcfc-3c1f8870d2cb.png" 
              alt="Runners Home Exchange" 
              className="h-12 w-auto mb-4 brightness-0 invert"
            />
            <p className="text-gray-300 mb-4 max-w-md">
              La plataforma que conecta corredores locales con viajeros, 
              ofreciendo alojamiento auténtico y experiencia compartida.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                Facebook
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                Instagram
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                Twitter
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Buscar Carreras</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Ser Host</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Cómo Funciona</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Comunidad</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Soporte</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Centro de Ayuda</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Términos y Condiciones</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Política de Privacidad</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contacto</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Seguridad</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Runners Home Exchange. Todos los derechos reservados.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0 text-sm text-gray-400">
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                España
              </span>
              <span className="flex items-center">
                <Mail className="h-4 w-4 mr-1" />
                hello@runnershome.exchange
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
