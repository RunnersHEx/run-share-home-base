import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface HowItWorksModalProps {
  children: React.ReactNode;
}

const HowItWorksModal = ({ children }: HowItWorksModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">
            ¿Cómo funciona?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 sm:space-y-8">
          {/* As a Host Section */}
          <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
            <h3 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4 text-blue-800 flex items-center">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-full mr-2 sm:mr-3 flex items-center justify-center">
                <span className="text-white text-xs sm:text-sm font-bold">H</span>
              </div>
              Como Anfitrión:
            </h3>
            <ol className="space-y-2 sm:space-y-3 list-decimal list-inside text-gray-700 text-sm sm:text-base">
              <li><strong>Regístrate y verifica tu identidad.</strong> La seguridad es lo primero.</li>
              <li><strong>Añade tu propiedad.</strong></li>
              <li><strong>Sugiere carreras locales interesantes</strong> para otros corredores.</li>
              <li><strong>Gana puntos.</strong></li>
              <li><strong>Acepta o rechaza solicitudes de alojamiento</strong> basándote en la información y reseñas del Huésped.</li>
              <li><strong>Conviértete en un Súper Anfitrión.</strong></li>
              <li><strong>Después de cada experiencia, no olvides dejar una reseña</strong> en la sección "Reseñas". El Huésped también te reseñará.</li>
            </ol>
          </div>

          {/* As a Guest Section */}
          <div className="bg-green-50 rounded-lg p-4 sm:p-6">
            <h3 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4 text-green-800 flex items-center">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-600 rounded-full mr-2 sm:mr-3 flex items-center justify-center">
                <span className="text-white text-xs sm:text-sm font-bold">G</span>
              </div>
              Como Huésped:
            </h3>
            <ol className="space-y-2 sm:space-y-3 list-decimal list-inside text-gray-700 text-sm sm:text-base">
              <li><strong>Busca carreras que te interesen.</strong> Explora por ubicación, fecha, tipo y distancia.</li>
              <li><strong>Solicita alojamiento para tu carrera elegida</strong> canjeando tus puntos. Envía tu solicitud al Anfitrión local de la carrera.</li>
              <li><strong>Conecta y planifica.</strong> Una vez que el Anfitrión acepte, coordina todos los detalles a través del sistema de mensajería interno.</li>
              <li><strong>Vive la experiencia.</strong> Disfruta del alojamiento, el conocimiento local y la compañía de otro entusiasta del running.</li>
              <li><strong>Una vez en casa, recuerda reseñar a tu Anfitrión</strong> en la sección "Reseñas". Ellos también te reseñarán.</li>
            </ol>
          </div>

          <div className="text-center bg-gray-50 rounded-lg p-3 sm:p-4">
            <p className="text-gray-600 italic text-sm sm:text-base">
              ¡Únete a nuestra comunidad de corredores y descubre el mundo a través de las carreras!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksModal;