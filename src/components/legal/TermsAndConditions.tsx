import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, Home, UserCheck, Shield, AlertCircle, Star, Mail, Gavel } from "lucide-react";

const TermsAndConditions = () => {
  return (
    <div className="space-y-6 text-gray-800">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Estos Términos y Condiciones regulan el acceso, registro y uso de la plataforma RUNNERS HOME EXCHANGE. Al registrarte, aceptas íntegramente estas condiciones.
        </AlertDescription>
      </Alert>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-6 w-6 mr-2 text-runner-blue-600" />
            1. ¿QUIÉNES SOMOS?
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            RUNNERS HOME EXCHANGE es una plataforma cuyo objetivo es facilitar el intercambio de alojamientos entre personas corredoras (runners) que deseen participar en eventos deportivos en diferentes ciudades y países. El servicio se presta a través del sitio web www.runnershomeexchange.com.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">La titular de la plataforma es RAQUEL LANDÍN COBOS:</h3>
            <ul className="space-y-1 text-gray-700">
              <li><strong>Mail:</strong> RUNNERSHOMEEXCHANGE@GMAIL.COM</li>
              <li><strong>Telf.:</strong> 636 11 51 54</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. OBJETO DE LAS CONDICIONES</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Las presentes Condiciones Generales regulan el acceso, registro y uso de la plataforma RUNNERS HOME EXCHANGE, así como los derechos y obligaciones de los usuarios dentro de la comunidad.
          </p>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Todos los usuarios deben aceptar estas condiciones al registrarse. La no aceptación impedirá el uso del servicio.
            </AlertDescription>
          </Alert>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. ¿A QUIÉN VA DIRIGIDA LA PLATAFORMA?</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            RUNNERS HOME EXCHANGE está dirigida exclusivamente a personas mayores de edad que practiquen running de manera habitual y estén dispuestas a:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-runner-blue-50 p-4 rounded-lg text-center">
              <Home className="h-8 w-8 mx-auto mb-2 text-runner-blue-600" />
              <p className="text-runner-blue-800 text-sm font-medium">Ofrecer su vivienda como alojamiento a otros runners</p>
            </div>
            <div className="bg-runner-orange-50 p-4 rounded-lg text-center">
              <UserCheck className="h-8 w-8 mx-auto mb-2 text-runner-orange-600" />
              <p className="text-runner-orange-800 text-sm font-medium">Ejercer de anfitriones en su ciudad durante la estancia</p>
            </div>
            <div className="bg-runner-green-50 p-4 rounded-lg text-center">
              <Star className="h-8 w-8 mx-auto mb-2 text-runner-green-600" />
              <p className="text-runner-green-800 text-sm font-medium">Participar activamente en el sistema de puntos</p>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed font-medium">
            Todos los usuarios deben ofrecer en ésta primera fase alojamiento y ejercer funciones de anfitrión.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. ¿CÓMO PUEDO INTERACTUAR EN RUNNERS HOME EXCHANGE?</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            El objetivo de RUNNERS HOME EXCHANGE es facilitar el intercambio de alojamientos entre corredores. Por ello, todos los usuarios desempeñarán, en distintos momentos, ambos roles disponibles en la plataforma:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border-2 border-runner-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Home className="h-6 w-6 mr-2 text-runner-blue-600" />
                <Badge className="bg-runner-blue-100 text-runner-blue-800">ANFITRIÓN (HOST)</Badge>
              </div>
              <p className="text-gray-700 text-sm">Cuando ofrezcan su vivienda a otros runners</p>
            </div>
            
            <div className="border-2 border-runner-orange-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <UserCheck className="h-6 w-6 mr-2 text-runner-orange-600" />
                <Badge className="bg-runner-orange-100 text-runner-orange-800">INVITADO (GUEST)</Badge>
              </div>
              <p className="text-gray-700 text-sm">Cuando soliciten alojamiento para asistir a una carrera</p>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-4">4.1. Derechos y obligaciones como ANFITRIÓN (HOST)</h3>
          <div className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-gray-700 ml-4">
              <li>Ofrecer un alojamiento real del que se tenga la libre disposición (bien como propietario, bien bajo cualquier otro título legítimo) y/o el derecho suficiente, licencias o permisos para ofrecerlo en los términos indicados.</li>
              <li>Garantizar que el alojamiento ofrecido en la plataforma reúne en todo momento las condiciones mínimas de habitabilidad, limpieza e higiene necesarias para proporcionar un entorno seguro, confortable y digno a los corredores invitados.</li>
              <li>El anfitrión (host) tendrá derecho a establecer normas básicas de convivencia y uso del alojamiento, con el fin de garantizar el buen estado del inmueble, la adecuada relación con los ocupantes y el respeto al entorno.</li>
              <li>Garantizar que el número de plazas indicadas como disponibles en su anuncio corresponde a espacios reales, habilitados y aptos para su uso como alojamiento temporal.</li>
              <li>Mantener sus datos actualizados y su calendario de disponibilidad correctamente configurado y actualizado.</li>
              <li>Actuar como anfitrión de forma activa: facilitar la llegada, resolver dudas, acompañar en lo posible, y mostrar disponibilidad durante la estancia.</li>
              <li><strong>Queda terminantemente prohibido solicitar cualquier compensación económica</strong> por el uso o acceso a los alojamientos o por cualquier otro servicio complementario que se dé en el seno de esta plataforma.</li>
            </ol>
          </div>

          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Normas de convivencia:</strong> Las normas deberán ser razonables, proporcionadas y compatibles con los principios de legalidad, respeto a la integridad física y moral, y al orden público. En ningún caso podrán contener disposiciones discriminatorias, abusivas o contrarias a los derechos fundamentales.
            </AlertDescription>
          </Alert>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">4.2. Régimen de responsabilidad del ANFITRIÓN (HOST)</h3>
          <div className="bg-red-50 p-4 rounded-lg">
            <ol className="list-decimal list-inside space-y-2 text-red-800">
              <li>La falsedad, omisión o incumplimiento de esta obligación podrá dar lugar a la suspensión o cancelación del perfil.</li>
              <li><strong>En caso de que, por cualquier motivo, el alojamiento ofrecido por el anfitrión (host) no pueda ser utilizado conforme al compromiso adquirido con otro usuario, será el anfitrión quien asuma íntegramente la responsabilidad derivada de dicho incumplimiento.</strong></li>
              <li>El anfitrión se obliga a comunicar con la mayor antelación posible cualquier circunstancia que impida la efectiva prestación del alojamiento comprometido.</li>
            </ol>
          </div>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">4.3. Derechos y obligaciones del usuario como INVITADO (GUEST)</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Cuando el usuario actúe como invitado, debe tener en cuenta que la disponibilidad, condiciones y características del alojamiento ofrecido dependen exclusivamente del anfitrión (host) que lo publica. RUNNERS HOME EXCHANGE no garantiza la veracidad, adecuación ni disponibilidad real de las estancias.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Al confirmar una estancia como invitado, el usuario se compromete a cumplir íntegramente con las condiciones acordadas con el anfitrión, incluyendo las fechas, número de ocupantes, normas de la vivienda y reglas de convivencia. Asimismo, deberá mantener una actitud respetuosa y responsable durante toda la estancia, y dejar una valoración honesta al finalizarla.
          </p>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">4.4. Régimen de responsabilidad del INVITADO (GUEST)</h3>
          <p className="text-gray-700 leading-relaxed mb-3">Los usuarios que intervengan como INVITADO (GUEST) son responsables de:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li>La veracidad de los datos introducidos.</li>
            <li>El cumplimiento de sus compromisos de alojamiento y las normas que haya establecido el HOST.</li>
            <li>Los posibles daños causados en la vivienda ajena.</li>
            <li>El comportamiento durante la estancia como invitado.</li>
            <li>Cualquier incumplimiento de la normativa legal aplicable.</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-3">
            El incumplimiento de estas obligaciones podrá conllevar la suspensión temporal o definitiva del perfil del usuario, así como la pérdida de puntos utilizados en la solicitud.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. OBLIGACIONES DE TODOS LOS USUARIOS</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700 ml-4">
            <li>Al registrarte en RUNNERS HOME EXCHANGE, garantizas que los datos personales facilitados son veraces, actuales y corresponden a tu identidad real.</li>
            <li>Todo usuario debe añadir al menos una propiedad válida y disponible, ofreciendo un alojamiento real, en condiciones de habitabilidad, limpieza e higiene.</li>
            <li>Comunicarse de forma respetuosa con el resto de usuarios y cumplir los compromisos adquiridos.</li>
            <li>Cada usuario es responsable de la seguridad y confidencialidad de sus credenciales de acceso (usuario y contraseña).</li>
            <li>RUNNERS HOME EXCHANGE podrá suspender o cancelar el perfil de cualquier usuario que facilite información falsa o utilice la plataforma con fines contrarios a la ley.</li>
            <li>Queda expresamente prohibido el uso de la plataforma para fines publicitarios o comerciales ajenos a su propósito.</li>
            <li>La interacción entre usuarios debe realizarse siempre a través de los canales internos de la plataforma.</li>
            <li>Ambas partes deben dejar valoraciones tras cada experiencia, lo cual contribuye a la reputación de la comunidad.</li>
          </ol>
        </section>

        <div className="bg-runner-blue-50 p-4 rounded-lg mt-8">
          <div className="flex items-center mb-2">
            <Mail className="h-5 w-5 mr-2 text-runner-blue-600" />
            <h3 className="font-semibold text-runner-blue-900">Contacto</h3>
          </div>
          <p className="text-runner-blue-800 text-sm">
            Para cualquier consulta sobre estos Términos y Condiciones, puede contactarnos en:
            <br />
            <strong>RUNNERSHOMEEXCHANGE@GMAIL.COM</strong>
            <br />
            <strong>Teléfono:</strong> 636 11 51 54
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;