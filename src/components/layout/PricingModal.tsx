import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PricingModalProps {
  children: React.ReactNode;
}

const PricingModal = ({ children }: PricingModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">
            ¿Cuánto cuesta?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center">
            <p className="text-base sm:text-lg mb-4">
              Disfruta de acceso ilimitado a la Plataforma de Intercambio de Casas para Corredores 
              por una tarifa anual de €59.
            </p>
            <div className="bg-runner-orange-50 border border-runner-orange-200 rounded-lg p-3 sm:p-4 mb-4">
              <p className="text-runner-orange-700 font-semibold text-base sm:text-lg">
                AHORA DISPONIBLE A UN PRECIO MUCHO MENOR CON NUESTRA OFERTA DE LANZAMIENTO.
              </p>
            </div>
            <p className="text-base sm:text-lg font-semibold text-runner-orange-600 mb-4 sm:mb-6">
              ¡No te pierdas esta oferta! Empieza a disfrutar de estancias ilimitadas.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-center">Beneficios incluidos:</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-runner-orange-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Acceso ilimitado a todas las carreras</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-runner-orange-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Intercambio de alojamiento ilimitado con anfitriones verificados</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-runner-orange-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Sistema de puntos para reservas</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-runner-orange-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Estadísticas detalladas de rendimiento</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-runner-orange-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <span className="text-sm sm:text-base">Recomendaciones personalizadas</span>
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingModal;