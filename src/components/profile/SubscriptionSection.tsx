import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Settings, Calendar, CreditCard, Tag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface Subscription {
  id: string;
  plan_name: string;
  plan_type: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
}

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_date: string;
}

interface Coupon {
  code: string;
  name: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  validUntil: string;
  isActive: boolean;
  type: string;
}

const SubscriptionSection = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [manageLoading, setManageLoading] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [fetchingData, setFetchingData] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<string>("");

  // Fetch subscription data on component mount
  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
      fetchActiveCoupons();
    }
  }, [user]);

  const fetchActiveCoupons = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-active-coupons');
      
      if (error) {
        console.error('Error fetching coupons:', error);
        return;
      }

      setCoupons(data?.coupons || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  const fetchSubscriptionData = async () => {
    try {
      setFetchingData(true);
      logger.info("Fetching subscription data for user:", user?.id);

      // Use Edge Function to fetch subscription data (bypasses RLS issues)
      const { data: subData, error: subError } = await supabase.functions.invoke('get-user-subscription', {
        body: { userId: user?.id }
      });

      if (subError) {
        logger.error("Error fetching subscription:", subError);
        // Fallback to direct query if Edge Function fails
        await fetchSubscriptionDirectly();
      } else if (subData?.subscription) {
        setSubscription(subData.subscription);
        setPaymentHistory(subData.paymentHistory || []);
        logger.info("Subscription data fetched successfully via Edge Function");
      } else {
        // No subscription found
        logger.info("No subscription found for user");
      }
    } catch (error) {
      logger.error("Exception fetching subscription data:", error);
      // Fallback to direct query
      await fetchSubscriptionDirectly();
    } finally {
      setFetchingData(false);
    }
  };

  // Fallback method using direct Supabase query
  const fetchSubscriptionDirectly = async () => {
    try {
      logger.info("Attempting direct subscription query");
      
      // Try direct query (this might work if RLS is properly configured)
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (subError && subError.code !== 'PGRST116') { // PGRST116 = no rows returned
        logger.error("Error with direct query:", subError);
        toast.error("Error al cargar la información de suscripción");
      } else if (subData) {
        setSubscription(subData);
        logger.info("Subscription data fetched successfully via direct query");

        // Fetch payment history if subscription exists
        const { data: paymentData, error: paymentError } = await supabase
          .from('subscription_payments')
          .select('*')
          .eq('subscription_id', subData.id)
          .order('payment_date', { ascending: false })
          .limit(5);

        if (!paymentError && paymentData) {
          setPaymentHistory(paymentData);
        }
      }
    } catch (error) {
      logger.error("Exception with direct query:", error);
      toast.error("Error al cargar la información de suscripción");
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Debes estar autenticado para suscribirte");
      return;
    }

    setLoading(true);
    
    try {
      // Use create-subscription function (which works with the existing system)
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { 
          userId: user.id,
          couponCode: selectedCoupon 
        }
      });

      if (error) {
        logger.error('Error creating subscription:', error);
        toast.error("Error al procesar la suscripción");
        return;
      }

      if (data?.url) {
        // Open in the same tab for better UX
        window.location.href = data.url;
      }
    } catch (error) {
      logger.error('Exception creating subscription:', error);
      toast.error("Error al procesar la suscripción");
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user || !subscription) {
      toast.error("No se encontró suscripción activa");
      return;
    }

    setManageLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription');

      if (error) {
        logger.error('Error managing subscription:', error);
        toast.error("Error al acceder al portal de gestión");
        return;
      }

      if (data?.url) {
        // Open in new tab for billing portal
        window.open(data.url, '_blank');
      }
    } catch (error) {
      logger.error('Exception managing subscription:', error);
      toast.error("Error al acceder al portal de gestión");
    } finally {
      setManageLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: 'Activa', className: 'bg-green-100 text-green-800' },
      canceled: { label: 'Cancelada', className: 'bg-red-100 text-red-800' },
      inactive: { label: 'Inactiva', className: 'bg-gray-100 text-gray-800' },
      expired: { label: 'Expirada', className: 'bg-gray-100 text-gray-800' },
      past_due: { label: 'Pago Pendiente', className: 'bg-yellow-100 text-yellow-800' },
      unpaid: { label: 'Sin Pagar', className: 'bg-red-100 text-red-800' }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const isActive = (status: string) => {
    return status === 'active';
  };

  const isCanceled = (status: string) => {
    return status === 'canceled';
  };

  const getSubscriptionMessage = (subscription: Subscription) => {
    if (isCanceled(subscription.status)) {
      const endDate = subscription.current_period_end ? formatDate(subscription.current_period_end) : 'fecha desconocida';
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
          <p className="text-yellow-800 text-sm">
            ⚠️ Tu suscripción ha sido cancelada y finalizará el <strong>{endDate}</strong>.
            Mantendrás acceso completo hasta esa fecha.
          </p>
        </div>
      );
    }
    return null;
  };

  const features = [
    "Acceso ilimitado a todas las carreras",
    "Intercambio de alojamiento con hosts verificados",
    "Sistema de puntos para reservas",
    "Estadísticas detalladas de rendimiento",
    "Recomendaciones personalizadas"
  ];

  const getSelectedPrice = () => {
    if (selectedCoupon) {
      const coupon = coupons.find(c => c.code === selectedCoupon);
      return coupon ? coupon.discountedPrice : 59;
    }
    return 59;
  };

  const renderCouponOptions = () => {
    if (coupons.length === 0) return null;

    return (
      <Card className="mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center text-orange-700">
            <Crown className="h-5 w-5 mr-2" />
            ¡Ofertas Especiales Disponibles!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {coupons.map((coupon) => (
              <div
                key={coupon.code}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedCoupon === coupon.code
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-orange-200 hover:border-orange-300 bg-white'
                }`}
                onClick={() => setSelectedCoupon(selectedCoupon === coupon.code ? "" : coupon.code)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          coupon.type === 'friends' 
                            ? 'bg-purple-100 text-purple-800 border-purple-300' 
                            : 'bg-orange-100 text-orange-800 border-orange-300'
                        }`}
                      >
                        {coupon.code}
                      </Badge>
                      <span className="font-medium text-gray-900">{coupon.name}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{coupon.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Válido hasta {coupon.validUntil}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center">
                      <span className="text-sm line-through text-gray-400 mr-2">€{coupon.originalPrice}</span>
                      <span className="text-xl font-bold text-green-600">€{coupon.discountedPrice}</span>
                    </div>
                    <div className="text-xs text-green-600">Ahorra €{coupon.originalPrice - coupon.discountedPrice}</div>
                  </div>
                </div>
              </div>
            ))}
            {/* Option to not use any coupon */}
            <div
              className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                selectedCoupon === ""
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => setSelectedCoupon("")}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium text-gray-900">Precio Regular</span>
                  <p className="text-sm text-gray-600 mt-1">Sin descuento aplicado</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-gray-900">€59</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (fetchingData) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mi Suscripción</h2>
          <p className="text-gray-600">Cargando información de suscripción...</p>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-runner-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mi Suscripción</h2>
        <p className="text-gray-600">
          Gestiona tu membresía y beneficios de RunnersHEx
        </p>
      </div>

      {subscription ? (
        <div className="space-y-6">
          {/* Current Subscription */}
          <Card className="border-2 border-runner-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center">
                  <Crown className="h-6 w-6 text-runner-blue-600 mr-2" />
                  {subscription.plan_name}
                </CardTitle>
                {getStatusBadge(subscription.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-600">Inicio:</span>
                    <span className="ml-2 font-medium">
                      {subscription.current_period_start ? formatDate(subscription.current_period_start) : 'No disponible'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-600">{isCanceled(subscription.status) ? 'Finaliza' : 'Renovación'}:</span>
                    <span className="ml-2 font-medium">
                      {subscription.current_period_end ? formatDate(subscription.current_period_end) : 'No disponible'}
                    </span>
                  </div>
                </div>

                {getSubscriptionMessage(subscription)}

                <div className="flex gap-4 pt-4">
                  {isActive(subscription.status) ? (
                    <Button
                      onClick={handleManageSubscription}
                      disabled={manageLoading}
                      variant="outline"
                      className="flex items-center"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {manageLoading ? "Cargando..." : "Gestionar Suscripción"}
                    </Button>
                  ) : isCanceled(subscription.status) ? (
                    <>
                      <Button
                        onClick={handleSubscribe}
                        disabled={loading}
                        className="bg-runner-blue-600 hover:bg-runner-blue-700 text-white"
                      >
                        {loading ? "Procesando..." : "Reactivar Suscripción"}
                      </Button>
                      <Button
                        onClick={handleManageSubscription}
                        disabled={manageLoading}
                        variant="outline"
                        className="flex items-center"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        {manageLoading ? "Cargando..." : "Ver Detalles"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleManageSubscription}
                      disabled={manageLoading}
                      variant="outline"
                      className="flex items-center"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {manageLoading ? "Cargando..." : "Ver Detalles"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CreditCard className="h-5 w-5 text-gray-600 mr-2" />
                  Historial de Pagos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium">{formatAmount(payment.amount, payment.currency)}</p>
                        <p className="text-sm text-gray-600">{formatDate(payment.payment_date)}</p>
                      </div>
                      <Badge className={payment.status === 'succeeded' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {payment.status === 'succeeded' ? 'Pagado' : 'Fallido'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isCanceled(subscription.status) 
                  ? `Beneficios (disponibles hasta ${subscription.current_period_end ? formatDate(subscription.current_period_end) : 'la fecha de finalización'})`
                  : 'Beneficios Incluidos'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${
                      isCanceled(subscription.status) ? 'text-yellow-500' : 'text-green-500'
                    }`} />
                    <span className={`${
                      isCanceled(subscription.status) ? 'text-gray-600' : 'text-gray-700'
                    }`}>{feature}</span>
                  </li>
                ))}
              </ul>
              {isCanceled(subscription.status) && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    💫 Para continuar disfrutando de estos beneficios después de la fecha de finalización, 
                    puedes reactivar tu suscripción en cualquier momento.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        // No subscription - show subscription options
        <div className="max-w-2xl mx-auto">
          {/* Show available coupons */}
          {renderCouponOptions()}
          
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
                {selectedCoupon && (
                  <span className="text-2xl line-through text-gray-400 mr-2">59€</span>
                )}
                <span className={`text-4xl font-bold ${
                  selectedCoupon ? 'text-green-600' : 'text-runner-blue-600'
                }`}>
                  {getSelectedPrice()}€
                </span>
                <span className="text-gray-600 ml-2">/año</span>
              </div>
              {selectedCoupon && (
                <div className="text-center">
                  <Badge className="bg-green-100 text-green-800 mt-2">
                    ¡Ahorro de €{59 - getSelectedPrice()}! • Código: {selectedCoupon}
                  </Badge>
                </div>
              )}
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
                    className={`w-full py-3 text-lg font-semibold ${
                      selectedCoupon 
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-runner-blue-600 hover:bg-runner-blue-700 text-white'
                    }`}
                  >
                    {loading ? "Procesando..." : `Suscribirse por ${getSelectedPrice()}€/año`}
                  </Button>
                </div>

                <div className="text-center text-sm text-gray-500">
                  <p>Pago seguro procesado por Stripe</p>
                  <p>Cancela cuando quieras</p>
                  {selectedCoupon && (
                    <p className="text-green-600 font-medium mt-1">
                      ✨ Descuento aplicado automáticamente en el checkout
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SubscriptionSection;
