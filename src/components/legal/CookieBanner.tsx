import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cookie, Settings, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import CookiePolicy from "./CookiePolicy";

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [cookiePreferences, setCookiePreferences] = useState({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('runnershex-cookie-consent');
    if (!cookieConsent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const preferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    };
    localStorage.setItem('runnershex-cookie-consent', JSON.stringify(preferences));
    setShowBanner(false);
    // Initialize analytics and other tracking here
  };

  const handleRejectAll = () => {
    const preferences = {
      necessary: true, // Necessary cookies cannot be rejected
      analytics: false,
      marketing: false,
      functional: false
    };
    localStorage.setItem('runnershex-cookie-consent', JSON.stringify(preferences));
    setShowBanner(false);
  };

  const handleCustomizeAccept = () => {
    localStorage.setItem('runnershex-cookie-consent', JSON.stringify(cookiePreferences));
    setShowBanner(false);
    setShowCustomize(false);
    // Initialize only selected tracking here
  };

  const handlePreferenceChange = (category: string, checked: boolean) => {
    setCookiePreferences(prev => ({
      ...prev,
      [category]: checked
    }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <Card className="fixed bottom-0 left-0 right-0 z-[9999] rounded-none border-t-2 border-runner-orange-500 shadow-2xl">
        <CardContent className="p-0">
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-start p-4 pb-3 border-b border-gray-200 pl-8">
              <div className="flex items-center space-x-3">
                <Cookie className="h-5 w-5 text-runner-orange-500" />
                <h3 className="text-base font-semibold text-gray-900">
                  Gestionar Configuración de Cookies
                </h3>
              </div>
            </div>
            
            {/* Main Content Area - Horizontal Layout */}
            <div className="flex">
              {/* Scrollable Content - Left Side */}
              <div className="flex-[2] max-h-[35vh] overflow-y-auto px-12 py-8" style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#d1d5db #f3f4f6'
              }}>
                <style>{`
                  .flex-\[2\]::-webkit-scrollbar {
                    width: 4px;
                  }
                  .flex-\[2\]::-webkit-scrollbar-track {
                    background: #f3f4f6;
                    border-radius: 2px;
                  }
                  .flex-\[2\]::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 2px;
                  }
                  .flex-\[2\]::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                  }
                  .flex-\[2\]::-webkit-scrollbar-button {
                    display: none;
                  }
                `}</style>
                <div className="text-gray-700 text-sm space-y-4 leading-relaxed pr-8 pl-2">
                  <p>
                    Este sitio web, como la mayoría de sitios web, utiliza cookies para mejorar y optimizar la experiencia del usuario. A continuación, encontrarás información detallada sobre qué son las cookies, los tipos utilizados en este sitio web, cómo deshabilitarlas en tu navegador y cómo bloquear específicamente la instalación de cookies de terceros.
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 text-base mt-4 mb-2">
                    ¿Qué son las Cookies y cómo las utiliza este sitio web?
                  </h4>
                  
                  <p>
                    Las cookies son archivos que el sitio web o aplicación que utilizas instala en tu navegador o dispositivo (teléfono inteligente, tableta o televisor inteligente) durante tu navegación por páginas o aplicaciones, y sirven para almacenar información sobre tu visita.
                  </p>
                  
                  <p>
                    <strong>RUNNERS HOME EXCHANGE</strong> utiliza cookies para:
                  </p>
                  
                  <ul className="list-disc list-inside space-y-1.5 ml-4 text-sm">
                    <li>Asegurar que el sitio web funcione correctamente.</li>
                    <li>Almacenar tus preferencias.</li>
                    <li>Comprender tu experiencia de navegación.</li>
                    <li>Recopilar información estadística anónima, como qué páginas has visto o cuánto tiempo has estado navegando.</li>
                  </ul>
                  
                  <p>
                    El uso de cookies nos permite optimizar tu navegación, adaptando la información y servicios ofrecidos a tus intereses para brindarte una mejor experiencia cada vez que nos visites.
                  </p>
                  
                  <p>
                    El sitio web utiliza cookies para operar, adaptarse y facilitar la navegación del usuario al máximo.
                  </p>
                  
                  <p>
                    Puedes encontrar más información sobre las cookies que utilizamos en nuestra{" "}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-runner-blue-600 underline font-medium text-sm"
                      onClick={() => setShowPolicyModal(true)}
                    >
                      Cookie Policy
                    </Button>
                  </p>
                  
                  <p>
                    Al hacer clic en <strong>"Aceptar,"</strong> consientes el uso de cookies analíticas y de marketing y aceptas el procesamiento correspondiente de datos personales.
                  </p>
                  
                  <p>
                    Al hacer clic en <strong>"Rechazar,"</strong> no tendrás una experiencia personalizada en nuestra plataforma.
                  </p>
                  
                  <p>
                    Puedes gestionar la configuración de tus cookies y retirar tu consentimiento en cualquier momento enviando un correo electrónico a{" "}
                    <a 
                      href="mailto:runnershomeexchange@gmail.com" 
                      className="text-runner-blue-600 underline font-medium"
                    >
                      runnershomeexchange@gmail.com
                    </a>
                  </p>
                </div>
              </div>
              
              {/* Action buttons - Right Side Vertical */}
              <div className="flex-[1] flex flex-col justify-center items-center space-y-3 p-6 border-l border-gray-200 bg-gradient-to-b from-gray-50 to-white min-w-[220px]">
                <Button 
                  onClick={handleAcceptAll}
                  className="bg-runner-orange-500 hover:bg-runner-orange-600 text-white text-lg py-6 px-16 font-semibold transition-all duration-200 shadow-sm hover:shadow-md w-[270px]"
                >
                  Aceptar Todo
                </Button>
                <Button 
                  onClick={() => setShowCustomize(true)}
                  className="bg-runner-blue-600 hover:bg-runner-blue-700 border-runner-blue-600 hover:border-runner-blue-700 text-white text-lg py-6 px-16 font-medium transition-all duration-200 shadow-sm group w-[270px]"
                >
                  <Settings className="h-5 w-5 mr-2 text-white" />
                  Personalizar
                </Button>
                <Button 
                  onClick={handleRejectAll}
                  className="bg-red-500 hover:bg-red-600 text-white text-lg py-6 px-16 font-semibold transition-all duration-200 shadow-sm hover:shadow-md w-[270px]"
                >
                  Rechazar Todo
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customize Cookies Modal */}
      <Dialog open={showCustomize} onOpenChange={setShowCustomize}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" style={{ zIndex: 10000 }}>
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-bold">
              <Settings className="h-6 w-6 mr-2 text-runner-orange-500" />
              Personalizar Cookies
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <p className="text-gray-700">
              Gestiona tus preferencias de cookies. Puedes habilitar o deshabilitar diferentes tipos de cookies a continuación.
            </p>
            
            <div className="space-y-4">
              {/* Necessary Cookies */}
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <Checkbox 
                  id="necessary" 
                  checked={true} 
                  disabled={true}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="necessary" className="font-semibold text-gray-900 block mb-1">
                    Cookies Necesarias
                  </label>
                  <p className="text-sm text-gray-700">
                    Estas cookies son esenciales para el funcionamiento del sitio web y no se pueden desactivar. 
                    Generalmente solo se establecen en respuesta a acciones realizadas por ti.
                  </p>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                <Checkbox 
                  id="analytics"
                  checked={cookiePreferences.analytics}
                  onCheckedChange={(checked) => handlePreferenceChange('analytics', checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="analytics" className="font-semibold text-gray-900 block mb-1">
                    Cookies Analíticas
                  </label>
                  <p className="text-sm text-gray-700">
                    Estas cookies nos permiten contar las visitas y fuentes de tráfico para poder medir y mejorar 
                    el rendimiento de nuestro sitio. Toda la información es agregada y anónima.
                  </p>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                <Checkbox 
                  id="functional"
                  checked={cookiePreferences.functional}
                  onCheckedChange={(checked) => handlePreferenceChange('functional', checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="functional" className="font-semibold text-gray-900 block mb-1">
                    Cookies Funcionales
                  </label>
                  <p className="text-sm text-gray-700">
                    Estas cookies habilitan funcionalidades mejoradas y personalización, como recordar tus 
                    preferencias y configuraciones.
                  </p>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                <Checkbox 
                  id="marketing"
                  checked={cookiePreferences.marketing}
                  onCheckedChange={(checked) => handlePreferenceChange('marketing', checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="marketing" className="font-semibold text-gray-900 block mb-1">
                    Cookies de Marketing
                  </label>
                  <p className="text-sm text-gray-700">
                    Estas cookies pueden ser establecidas a través de nuestro sitio por nuestros socios 
                    publicitarios para mostrar anuncios relevantes en otros sitios.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCustomize(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCustomizeAccept}
                className="flex-1 bg-runner-orange-500 hover:bg-runner-orange-600"
              >
                Guardar Preferencias
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cookie Policy Modal */}
      <Dialog open={showPolicyModal} onOpenChange={setShowPolicyModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 flex flex-col" style={{ zIndex: 10000 }}>
          <DialogHeader className="p-8 pb-0 flex-shrink-0">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Cookie Policy
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-8">
            <div className="pb-8">
              <CookiePolicy />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieBanner;