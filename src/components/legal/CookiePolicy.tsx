import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Globe, Settings, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

const CookiePolicy = () => {
  return (
    <div className="space-y-6 text-gray-800">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Esta Política de Cookies explica qué son las cookies, cómo las utilizamos y cómo puedes controlarlas en nuestro sitio web.
        </AlertDescription>
      </Alert>

      <div className="prose prose-lg max-w-none">
        <p className="text-gray-700 leading-relaxed mb-6">
          Este sitio web, al igual que la mayoría de los sitios en Internet, usa Cookies para mejorar y optimizar la experiencia del usuario. A continuación encontrarás información detallada sobre qué son las "Cookies", qué tipología utiliza este sitio web, cómo puedes desactivarlas en tu navegador y cómo bloquear específicamente la instalación de Cookies de terceros.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="h-6 w-6 mr-2 text-runner-blue-600" />
            ¿Qué son las Cookies y cómo las utilizamos?
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Las Cookies son archivos que el sitio web o la aplicación que utilizas instala en tu navegador o en tu dispositivo (Smartphone, tableta o televisión conectada) durante tu recorrido por páginas o por aplicación, y sirven para almacenar información sobre tu visita.
          </p>
          
          <div className="bg-runner-blue-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-runner-blue-900 mb-3">RUNNERS HOME EXCHANGE utiliza cookies para:</h3>
            <ul className="list-disc list-inside space-y-2 text-runner-blue-800">
              <li>Que las páginas web puedan funcionar correctamente.</li>
              <li>Almacenar tus preferencias.</li>
              <li>Conocer tu experiencia de navegación.</li>
              <li>Recopilar información estadística anónima, como qué páginas has visto o cuánto tiempo has estado navegando.</li>
            </ul>
          </div>

          <p className="text-gray-700 leading-relaxed">
            El uso de Cookies nos permite optimizar tu navegación, adaptando la información y los servicios ofrecidos a tus intereses para proporcionarte una mejor experiencia siempre que nos visites. Las Cookies se asocian únicamente a un usuario anónimo y su ordenador/dispositivo y no proporcionan referencias que permitan conocer datos personales.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
            <Eye className="h-6 w-6 mr-2 text-runner-blue-600" />
            ¿Por qué son importantes?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Técnicas</h4>
              <p className="text-green-800 text-sm">
                Permiten que los sitios web funcionen de forma más ágil y adaptada a las preferencias de los usuarios, como almacenar el idioma o detectar el dispositivo de acceso.
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Estadísticas</h4>
              <p className="text-blue-800 text-sm">
                Permiten que los gestores de los medios puedan conocer datos estadísticos recopilados para mejorar la calidad y experiencia de sus servicios.
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">Personalización</h4>
              <p className="text-purple-800 text-sm">
                Sirven para optimizar la publicidad que mostramos a los usuarios, ofreciendo la que más se ajusta a sus intereses.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">¿Cuáles son los diferentes tipos de Cookies que utilizamos?</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-runner-orange-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">Cookies de Sesión</h4>
              <p className="text-gray-700 text-sm">
                Expiran cuando el Usuario abandona la página o cierra el navegador, es decir, están activas mientras dura la visita al sitio web y por tanto son borradas de nuestro ordenador al abandonarlo.
              </p>
            </div>
            
            <div className="border-l-4 border-runner-blue-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">Cookies Permanentes</h4>
              <p className="text-gray-700 text-sm">
                Expiran cuando se cumple el objetivo para el que sirven o bien cuando se borran manualmente, tienen fecha de borrado y se utilizan normalmente en los procesos de registro, solicitud de información y personalización de servicios.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <h4 className="font-semibold text-gray-900">Por origen:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-semibold text-gray-900 mb-2">Cookies Propias</h5>
                <p className="text-gray-700 text-sm">
                  Son aquellas cookies que son enviadas a tu ordenador y gestionadas exclusivamente por nosotros para el mejor funcionamiento del Sitio Web. La información que recabamos se emplea para mejorar la calidad de nuestro servicio y tu experiencia como usuario.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-semibold text-gray-900 mb-2">Cookies de Terceros</h5>
                <p className="text-gray-700 text-sm">
                  Si interactúas con el contenido de nuestro Sitio Web también pueden establecerse cookies de terceros (por ejemplo, al pulsar botones de redes sociales o visionar vídeos alojados en otro sitio web).
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies específicas que utilizamos</h2>
          
          <Alert>
            <Globe className="h-4 w-4" />
            <AlertDescription>
              <strong>Navegar por esta web supone que se puedan instalar Cookies propias que permiten reconocer usuarios. Además, también se hace uso de cookies permanentes de Google Analytics con las siguientes finalidades:</strong>
            </AlertDescription>
          </Alert>

          <div className="mt-4 space-y-3">
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Identificar tráfico web de confianza.</strong></li>
              <li><strong>Monitorizar y controlar las sesiones del visitante</strong> para conocer y comprender la actividad del usuario en la página.</li>
              <li><strong>Campañas de marketing y anuncios publicitarios;</strong> aumento del tráfico en la web y estudios analíticos.</li>
              <li><strong>Conocer y recordar las preferencias del usuario</strong> y la información durante la visualización.</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg mt-4">
            <h4 className="font-semibold text-yellow-900 mb-2">Servicios de Terceros</h4>
            <p className="text-yellow-800 text-sm mb-2">
              Para mayor información sobre los complementos de entidades externas (por ejemplo, los servicios de Google Inc) utilizados en nuestra web, recomendamos acceder a sus políticas de privacidad:
            </p>
            <Button variant="link" className="text-yellow-900 p-0 h-auto">
              <strong>GOOGLE: http://www.google.es/intl/es/policies/privacy/</strong>
            </Button>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="h-6 w-6 mr-2 text-runner-blue-600" />
            Cómo controlar las cookies
          </h2>
          
          <p className="text-gray-700 leading-relaxed mb-4">
            Al navegar y continuar en nuestro Sitio Web estará consintiendo el uso de las Cookies en las condiciones contenidas en la presente Política de Cookies. RAQUEL LANDÍN COBOS proporciona acceso a esta Política de Cookies en el momento del registro con el objetivo de que el usuario esté informado.
          </p>
          
          <p className="text-gray-700 leading-relaxed mb-4">
            En cualquier caso le informamos de que, dado que las Cookies no son necesarias para el uso de nuestro Sitio Web, puede bloquearlas o deshabilitarlas activando la configuración de su navegador, que le permite rechazar la instalación de todas las cookies o de algunas de ellas.
          </p>

          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              Si rechaza las cookies podrá seguir usando nuestro Sitio Web, aunque el uso de algunos de sus servicios podrá ser limitado y por tanto su experiencia en nuestro Sitio Web menos satisfactoria.
            </AlertDescription>
          </Alert>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Configuración por navegador</h2>
          
          <p className="text-gray-700 leading-relaxed mb-4">
            A continuación te indicamos los links de los principales navegadores y dispositivos para que dispongas de toda la información para consultar cómo gestionar las cookies en tu navegador:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Safari</h4>
                <Button variant="link" className="text-runner-blue-600 p-0 h-auto text-sm">
                  http://support.apple.com/kb/PH5042
                </Button>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Chrome</h4>
                <Button variant="link" className="text-runner-blue-600 p-0 h-auto text-sm">
                  https://support.google.com/chrome/answer/95647
                </Button>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Firefox</h4>
                <Button variant="link" className="text-runner-blue-600 p-0 h-auto text-sm">
                  http://support.mozilla.org/es/kb/cookies-informacion
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Internet Explorer</h4>
                <Button variant="link" className="text-runner-blue-600 p-0 h-auto text-sm">
                  http://windows.microsoft.com/es-ES/windows7/How-to-manage-cookies
                </Button>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Opera</h4>
                <Button variant="link" className="text-runner-blue-600 p-0 h-auto text-sm">
                  https://help.opera.com/en/latest/web-preferences/#cookies
                </Button>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Android</h4>
                <Button variant="link" className="text-runner-blue-600 p-0 h-auto text-sm">
                  http://support.google.com/android/?hl=es
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">¿Actualizamos nuestra Política de Cookies?</h2>
          <p className="text-gray-700 leading-relaxed">
            Es posible que actualicemos la Política de Cookies de nuestro Sitio Web, por ello le recomendamos revisar esta política cada vez que acceda a nuestro Sitio Web con el objetivo de estar adecuadamente informado sobre cómo y para qué usamos las cookies. RAQUEL LANDÍN COBOS no se hace responsable del contenido y veracidad de las políticas de cookies de los terceros.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-runner-blue-600" />
            6. INFORMACIÓN SOBRE PRIVACIDAD
          </h2>
          
          <p className="text-gray-700 leading-relaxed mb-4">
            Sin perjuicio de obtener información más detallada en nuestra POLÍTICA DE PRIVACIDAD, proporcionamos la siguiente información en materia de protección de datos de carácter personal:
          </p>

          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div>
              <strong className="text-gray-900">- RESPONSABLE DEL TRATAMIENTO:</strong>
              <p className="text-gray-700">RAQUEL LANDÍN COBOS</p>
            </div>
            
            <div>
              <strong className="text-gray-900">- FINALIDADES:</strong>
              <p className="text-gray-700">Conocer las preferencias del usuario y mejorar su experiencia durante la navegación a través del uso de las cookies cuyas finalidades concretas han sido detalladas anteriormente.</p>
            </div>
            
            <div>
              <strong className="text-gray-900">- LEGITIMACIÓN Y PLAZO DE CONSERVACIÓN:</strong>
              <p className="text-gray-700">El tratamiento de sus datos se basa en el consentimiento o la necesidad de llevarse a cabo y los plazos se indican para cada una de las cookies.</p>
            </div>
            
            <div>
              <strong className="text-gray-900">- EJERCICIO DE DERECHOS:</strong>
              <p className="text-gray-700">Todos los usuarios pueden ejercitar cualquier de los derechos otorgados por la normativa de protección de datos, como el derecho de acceso, rectificación, limitación del tratamiento, supresión, portabilidad de datos y oposición que le asisten mediante escrito dirigido a <strong>RUNNERSHOMEEXCHANGE@GMAIL.COM</strong>. Y en el caso de que lo estime oportuno podrá presentar reclamación ante la Autoridad de Control pertinente.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CookiePolicy;