
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, CreditCard, Zap, CheckCircle, AlertCircle } from "lucide-react";

interface Subscription {
  id: string;
  plan_type: string;
  status: string;
  points_balance: number;
  subscription_end: string | null;
  stripe_customer_id: string | null;
  created_at: string;
}

const SubscriptionSection = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      toast.info("Redirigiendo a Stripe para suscripción...");
      
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Error al crear la suscripción');
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error managing subscription:', error);
      toast.error('Error al gestionar la suscripción');
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Activa</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-700 border-red-200"><AlertCircle className="h-3 w-3 mr-1" />Cancelada</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200"><AlertCircle className="h-3 w-3 mr-1" />Expirada</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><AlertCircle className="h-3 w-3 mr-1" />Pendiente</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Mi Suscripción
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Membresía Runners HEx</h3>
                  <p className="text-gray-600">Plan Anual - €79/año</p>
                </div>
                {getStatusBadge(subscription.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Fecha de suscripción</p>
                    <p className="font-medium">{formatDate(subscription.created_at)}</p>
                  </div>
                </div>

                {subscription.subscription_end && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Renovación</p>
                      <p className="font-medium">{formatDate(subscription.subscription_end)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">Balance de Puntos</p>
                  <p className="text-2xl font-bold text-blue-600">{subscription.points_balance} puntos</p>
                </div>
              </div>

              {subscription.status === 'active' && subscription.stripe_customer_id && (
                <Button onClick={handleManageSubscription} variant="outline" className="w-full">
                  Gestionar Suscripción
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">¡Únete a la Comunidad!</h3>
                <p className="text-gray-600 mb-4">
                  Accede a la red global de corredores con nuestra membresía anual
                </p>
                <div className="space-y-2 text-sm text-gray-600 mb-6">
                  <p>✓ 1200 puntos anuales incluidos</p>
                  <p>✓ Acceso a toda la red de hosts</p>
                  <p>✓ Sistema de intercambio justo</p>
                  <p>✓ Experiencias auténticas</p>
                </div>
                <div className="text-center mb-4">
                  <span className="text-3xl font-bold text-blue-600">€79</span>
                  <span className="text-gray-600">/año</span>
                </div>
                <Button onClick={handleSubscribe} className="bg-blue-600 hover:bg-blue-700">
                  Suscribirse Ahora
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSection;
