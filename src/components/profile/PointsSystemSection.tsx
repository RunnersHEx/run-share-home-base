
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Home,
  Trophy,
  Gift,
  Plus,
  Star,
  X,
  User,
  Shield
} from "lucide-react";

interface PointsTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  booking_id?: string;
}

const PointsSystemSection = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'subscription_points':
        return <Gift className="h-4 w-4 text-blue-600" />;
      case 'booking_earning':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'booking_payment':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'booking_refund':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default:
        return <Coins className="h-4 w-4 text-gray-600" />;
    }
  };

  const earnPointsData = [
    {
      icon: Home,
      title: "Ser Host",
      description: "Gana puntos cada vez que hospedas a un corredor",
      points: "+ 30 puntos por noche",
      color: "text-green-600"
    },
    {
      icon: Plus,
      title: "Agregar propiedad",
      description: "Por agregar tu propiedad y ser revisada correctamente",
      points: "+ 40 puntos",
      color: "text-blue-600"
    },
    {
      icon: Trophy,
      title: "Agregar carreras",
      description: "Por cada carrera agregada y aprobada",
      points: "+ 25 puntos",
      color: "text-yellow-600"
    },
    {
      icon: Star,
      title: "Rating 5 estrellas",
      description: "Por cada reseña valorada con 5*",
      points: "+ 15 puntos",
      color: "text-orange-600"
    },
    {
      icon: User,
      title: "Perfil completado",
      description: "Completa tu perfil desde \"Mi inicio\"",
      points: "+ 25 puntos",
      color: "text-purple-600"
    },
    {
      icon: Shield,
      title: "Verificación de identidad",
      description: "Adjunta los documentos requeridos y espera a ser verificado correctamente",
      points: "+ 40 puntos",
      color: "text-indigo-600"
    },
    {
      icon: Gift,
      title: "Nuevo suscriptor",
      description: "Puntos iniciales al suscribirte por primera vez",
      points: "+ 100 puntos",
      color: "text-green-600"
    },
    {
      icon: X,
      title: "Cancelación reserva como host",
      description: "Si el Host cancela la reserva con menos de 60 días de antelación",
      points: "- 30 puntos",
      color: "text-red-600"
    }
  ];

  const spendPointsData = [
    {
      icon: Calendar,
      title: "Reservar Estancias",
      description: "Usa puntos para reservar alojamiento con hosts (coste variable según demanda)",
      points: "25-70 puntos/noche",
      color: "text-red-600"
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Coins className="h-5 w-5 mr-2" />
            Sistema de Puntos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="how-it-works">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="how-it-works">Cómo Funciona</TabsTrigger>
              <TabsTrigger value="history">Mi Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="how-it-works" className="space-y-6">
              {/* Earn Points Section */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                  Cómo Ganar Puntos
                </h3>
                <div className="grid gap-4">
                  {earnPointsData.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                        <Icon className={`h-6 w-6 ${item.color} mt-1`} />
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                          <Badge variant="outline" className={`text-xs ${item.color}`}>
                            {item.points}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Spend Points Section */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
                  Cómo Usar Puntos
                </h3>
                <div className="grid gap-4">
                  {spendPointsData.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                        <Icon className={`h-6 w-6 ${item.color} mt-1`} />
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                          <Badge variant="outline" className={`text-xs ${item.color}`}>
                            {item.points}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Key Points */}
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">💡 Puntos Clave</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Los 100 puntos de suscripción se renuevan anualmente</li>
                  <li>• Puntos ganados por hosting no expiran</li>
                  <li>• Fomenta intercambios auténticos entre corredores</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">Historial de Transacciones</h3>
                
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-600">{formatDate(transaction.created_at)}</p>
                          </div>
                        </div>
                        <div className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount} pts
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Coins className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay transacciones todavía</p>
                    <p className="text-sm">Empieza usando la plataforma para ver tu historial</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PointsSystemSection;
