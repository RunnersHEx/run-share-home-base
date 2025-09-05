import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Users, Lock, Eye, Mail } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="space-y-6 text-gray-800">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Esta Política de Privacidad explica cómo RUNNERS HOME EXCHANGE recopila, usa y protege tu información personal.
        </AlertDescription>
      </Alert>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-6 w-6 mr-2 text-runner-blue-600" />
            1. RESPONSABLE DEL TRATAMIENTO Y FINALIDADES
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            En cumplimiento del Reglamento (UE) 2016/679 de 27 de abril (GDPR) y la Ley Orgánica 3/2018 de 5 de diciembre (LOPDGDD), se le informa de que la <strong>RESPONSABLE DEL TRATAMIENTO</strong> de los datos personales es <strong>RAQUEL LANDÍN COBOS</strong>.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Los datos serán tratados, según el canal por el que se recaben, con las siguientes finalidades:
          </p>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">1.1. En los formularios de contacto:</h3>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Datos solicitados</h4>
            <p className="text-gray-700">Nombre, correo electrónico.</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Finalidades</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Gestionar los formularios de contacto para atender las solicitudes de información y dar respuesta a las cuestiones planteadas.</li>
              <li>Informar sobre cualquier aspecto empresarial, comercial o social de la entidad y las actividades que organice o en las que participe.</li>
              <li>Remitir cuestionarios, así como realizar encuestas y estudios estadísticos, para conocer intereses del usuario acerca de sus preferencias.</li>
            </ul>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h5 className="font-semibold text-blue-900 mb-1">Legitimación</h5>
                <p className="text-blue-800 text-sm">El consentimiento del usuario, así como la aplicación de medidas precontractuales legitiman el tratamiento de sus datos.</p>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <h5 className="font-semibold text-green-900 mb-1">Plazo de conservación</h5>
                <p className="text-green-800 text-sm">Los datos serán conservados el tiempo necesario para dar respuesta a las consultas y cumplir los fines indicados.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">1.2. Registro y alta de usuarios</h3>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Datos solicitados</h4>
            <p className="text-gray-700">
              Se requerirá que se completen datos tales como nombre completo, fecha de nacimiento, DNI, fotografía, provincia de residencia, correo electrónico y teléfono, así como información acerca de las preferencias de carrera (tipo: montaña o asfalto), distancias habituales, tiempos aproximados u otros indicadores relevantes para definir el perfil como corredor.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Finalidades</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Gestionar su inscripción como usuario registrado, validar su identidad con el DNI y fotografía</strong>, para permitir su interacción en la plataforma como INVITADO (GUEST) o como ANFITRIÓN (HOST).</li>
              <li><strong>Realizar análisis de segmentación según su perfil runner</strong> con el único objetivo de agrupar a los usuarios en diferentes categorías basadas en tiempos y tipos de carrera, de manera que sea más fácil el contacto e interacción entre usuarios afines.</li>
              <li>Permitir el contacto con otros usuarios, así como el acceso a las actividades promovidas en el seno de nuestra comunidad.</li>
              <li>Informar sobre cualquier aspecto empresarial, comercial o social de la empresa y las actividades que organice o en las que participe.</li>
            </ul>

            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> En ningún caso se adoptarán decisiones automatizadas que produzcan efectos jurídicos o le afecten significativamente de manera similar. Todo usuario podrá formalizar su oposición al respecto en el correo electrónico RUNNERSHOMEEXCHANGE@GMAIL.COM
              </AlertDescription>
            </Alert>
          </div>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">1.3. Por la información y fotografía de perfil</h3>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Datos solicitados</h4>
            <p className="text-gray-700">
              Se requerirá que se completen datos tales como nombre, edad, correo electrónico, teléfono, así como información acerca de las preferencias de carrera (tipo: montaña o asfalto), distancias habituales, tiempos aproximados u otros indicadores relevantes para definir el perfil como corredor. También podrá subirse una foto del usuario.
            </p>
            <p className="text-gray-700 mt-2 font-medium">
              Estos datos de perfil, así como la fotografía, solo serán visibles para el resto de la comunidad cuando así se activen por el usuario.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Finalidades</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Crear un perfil de usuario dentro de RUNNERS HOME EXCHANGE (donde, como ya se ha indicado, solo se compartirán los datos del perfil que el usuario active para ello).</li>
              <li><strong>En caso de que se suba una fotografía del usuario, éste consiente que aparezca en su perfil y se vincule con los datos que haya proporcionado, quedando visible para el resto de usuarios de RUNNERS HOME EXCHANGE si así se activa.</strong></li>
              <li>Permitir el contacto con otros usuarios, así como el acceso a las actividades promovidas en el seno de nuestra comunidad.</li>
            </ul>

            <div className="bg-yellow-50 p-4 rounded-lg mt-4">
              <h5 className="font-semibold text-yellow-900 mb-2 flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                VISIBILIDAD ENTRE USUARIOS
              </h5>
              <p className="text-yellow-800 text-sm mb-2">
                Se limitará a los datos imprescindibles (nombre, localización del alojamiento ofrecido o solicitado, perfil deportivo, etc.) y siempre bajo los principios de minimización y proporcionalidad. Esta visibilidad tiene como finalidad facilitar el contacto entre usuarios, posibilitar la solicitud y reserva de alojamientos, así como identificar a los runners interesados en una estancia concreta.
              </p>
              <p className="text-yellow-800 text-sm">
                <strong>OPOSICIÓN:</strong> Puede oponerse a esta cesión de datos comunicándonoslo en el correo electrónico RUNNERSHOMEEXCHANGE@GMAIL.COM
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">1.4. En el caso del blog y/o suscripción de newsletter:</h3>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Datos solicitados</h4>
            <p className="text-gray-700">Nombre, correo electrónico.</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Finalidades</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Envío de boletines informativos (newsletter)</li>
              <li>En el caso del blog, incluirle en la lista de distribución de la newsletter, además de gestionar, en su caso, el envío de opiniones y comentarios de los post, sus respuestas y comunicaciones de las mismas.</li>
              <li>Informar sobre cualquier aspecto empresarial, comercial o social de la entidad y las actividades que organice o en las que participe.</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-runner-blue-600" />
            2. DERECHOS DEL INTERESADO
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Los derechos que asisten al USUARIO son:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li>Derecho a retirar el consentimiento en cualquier momento.</li>
            <li>Derecho de acceso, rectificación, portabilidad y supresión de sus datos y a la limitación u oposición al su tratamiento.</li>
            <li>Derecho a presentar una reclamación ante la autoridad de control (www.aepd.es) si considera que el tratamiento no se ajusta a la normativa vigente.</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            Puede ejercitarlos dirigiéndose a RAQUEL LANDÍN COBOS, en la dirección de correo electrónico <strong>RUNNERSHOMEEXCHANGE@GMAIL.COM</strong> acreditando su identidad.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
            <Lock className="h-6 w-6 mr-2 text-runner-blue-600" />
            3. MEDIDAS DE SEGURIDAD
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            De conformidad con lo dispuesto en la legislación en materia de protección de datos personales, RAQUEL LANDÍN COBOS, cumple con todas las obligaciones que le corresponden como responsable del tratamiento. En este sentido, garantiza que ha implementado las políticas técnicas y organizativas apropiadas para aplicar las medidas de seguridad que establecen el GDPR y la LOPDGDD con el fin de proteger los derechos y libertades de los USUARIOS.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Para más información sobre las garantías de privacidad, puedes dirigirte a RAQUEL LANDÍN COBOS a través del correo electrónico <strong>RUNNERSHOMEEXCHANGE@GMAIL.COM</strong>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. INFORMACIÓN SOBRE LA UTILIZACIÓN DE COOKIES</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Por el mero hecho de visitar el presente portal web no queda registrado de forma automática ningún dato de carácter personal que identifique a un Usuario. Sin embargo, le informamos que durante la navegación por el Sitio Web se utilizan «cookies», pequeños ficheros de datos que se generan en el ordenador del usuario y que nos permiten obtener información analítica.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Para más información visite nuestra <strong>política de cookies</strong>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. MODIFICACIÓN DE NUESTRA POLÍTICA DE PRIVACIDAD</h2>
          <p className="text-gray-700 leading-relaxed">
            Nuestra Política de Privacidad podrá modificarse y actualizarse ante nuevos requerimientos legales, así como por mejoras y cambios en la forma de ofrecer y prestar nuestros servicios y utilidades de la web. Por ello, le recomendamos que visite y acceda a nuestra Política de Privacidad periódicamente, aunque en caso de que tales cambios guarden relación con el consentimiento prestado por el usuario, en tal caso le será enviada una notificación independiente y por separado para recabarlo nuevamente.
          </p>
        </section>

        <div className="bg-runner-blue-50 p-4 rounded-lg mt-8">
          <div className="flex items-center mb-2">
            <Mail className="h-5 w-5 mr-2 text-runner-blue-600" />
            <h3 className="font-semibold text-runner-blue-900">Contacto</h3>
          </div>
          <p className="text-runner-blue-800 text-sm">
            Para cualquier consulta sobre esta Política de Privacidad, puede contactarnos en:
            <br />
            <strong>RUNNERSHOMEEXCHANGE@GMAIL.COM</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;