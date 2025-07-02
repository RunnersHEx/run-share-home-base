
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SubscriptionSection = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Debes estar autenticado para suscribirte");
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { userId: user.id }
      });

      if (error) {
        console.error('Error creating subscription:', error);
        toast.error("Error al procesar la suscripción");
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Exception creating subscription:', error);
      toast.error("Error al procesar la suscripción");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    "Acceso ilimitado a todas las carreras",
    "Intercambio de alojamiento con hosts verificados",
    "Sistema de puntos para reservas",
    "Soporte prioritario 24/7",
    "Acceso a eventos exclusivos",
    "Comunidad premium de runners",
    "Estadísticas detalladas de rendimiento",
    "Recomendaciones personalizadas"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mi Suscripción</h2>
        <p className="text-gray-600">
          Gestiona tu membresía y beneficios de RunnersHEx
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Plan Actual */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Estado Actual</CardTitle>
              <Badge variant="outline">Gratis</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Actualmente tienes una cuenta gratuita con acceso limitado.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-orange-500 mr-2" />
                  <span className="font-medium text-orange-700">
                    Actualiza para acceso completo
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Premium */}
        <Card className="border-2 border-runner-blue-200 relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-runner-blue-600 text-white px-4 py-1">
              <Crown className="h-4 w-4 mr-1" />
              Recomendado
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Crown className="h-6 w-6 text-runner-blue-600 mr-2" />
              Membresía RunnersHEx Premium
            </CardTitle>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-runner-blue-600">59€</span>
              <span className="text-gray-600 ml-2">/año</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="pt-4">
                <Button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full bg-runner-blue-600 hover:bg-runner-blue-700 text-white py-3 text-lg font-semibold"
                >
                  {loading ? "Procesando..." : "Suscribirse por 59€/año"}
                </Button>
              </div>

              <div className="text-center text-sm text-gray-500">
                <p>Pago seguro procesado por Stripe</p>
                <p>Cancela cuando quieras</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Beneficios adicionales */}
      <Card>
        <CardHeader>
          <CardTitle>¿Por qué elegir Premium?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-runner-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-runner-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Acceso Ilimitado</h3>
              <p className="text-gray-600 text-sm">
                Participa en todas las carreras sin restricciones
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Hosts Verificados</h3>
              <p className="text-gray-600 text-sm">
                Alojamiento seguro con hosts completamente verificados
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Soporte Premium</h3>
              <p className="text-gray-600 text-sm">
                Atención prioritaria 24/7 para resolver cualquier duda
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSection;
