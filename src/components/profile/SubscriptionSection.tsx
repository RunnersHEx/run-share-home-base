
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown } from "lucide-react";
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
        // Abrir en una nueva pestaña
        window.open(data.url, '_blank');
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

      <div className="max-w-md mx-auto">
        {/* Plan Premium */}
        <Card className="border-2 border-runner-blue-200 relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-runner-blue-600 text-white px-4 py-1">
              <Crown className="h-4 w-4 mr-1" />
              Recomendado
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-xl flex items-center justify-center">
              <Crown className="h-6 w-6 text-runner-blue-600 mr-2" />
              Membresía RunnersHEx
            </CardTitle>
            <div className="flex items-baseline justify-center">
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
    </div>
  );
};

export default SubscriptionSection;
