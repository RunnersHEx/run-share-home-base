import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Crown, ArrowRight, Home } from "lucide-react";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  // If they're on this page, payment succeeded and account was created
  const paymentDetails = {
    customerEmail: "Verificado ✓",
    planName: "Membresía RunnersHEx",
    amount: "€59.00",
    duration: "1 año",
    status: "succeeded"
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-800">Sesión no encontrada</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">No se encontró información de la sesión de pago.</p>
            <Button asChild>
              <Link to="/">
                Volver al Inicio
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-gray-900">¡Pago Exitoso!</CardTitle>
          <p className="text-gray-600 mt-2">
            Tu suscripción a RunnersHEx ha sido activada
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Welcome Message */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">¡Bienvenido a RunnersHEx!</h3>
            <p className="text-sm text-green-700">
              Tu cuenta ha sido creada y tu suscripción está activa. 
              Ya puedes comenzar a explorar carreras y conectar con otros runners.
            </p>
          </div>

          {/* Plan Details */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center mb-3">
              <Crown className="h-5 w-5 text-runner-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Plan Adquirido</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium">{paymentDetails.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Precio:</span>
                <span className="font-medium">{paymentDetails.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duración:</span>
                <span className="font-medium">{paymentDetails.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="font-medium text-green-600">✓ Completado</span>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Lo que incluye tu membresía:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Acceso ilimitado a todas las carreras
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                1200 puntos incluidos para reservas
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Intercambio de alojamiento con hosts verificados
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Estadísticas detalladas de rendimiento
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Recomendaciones personalizadas
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button asChild className="w-full bg-runner-blue-600 hover:bg-runner-blue-700">
              <Link to="/profile?tab=subscription">
                Ver Mi Suscripción
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Volver al Inicio
              </Link>
            </Button>
          </div>

          {/* Receipt Info */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              ¡Recibes 1200 puntos para comenzar a usar la plataforma!
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Recibirás un recibo de compra por email
            </p>
            {sessionId && (
              <p className="text-xs text-gray-400 mt-1">
                ID de sesión: {sessionId.substring(0, 20)}...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
