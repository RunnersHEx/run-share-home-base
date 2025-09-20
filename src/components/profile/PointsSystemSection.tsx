import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { usePoints, useBookingCost } from "@/hooks/usePoints";
import { PointsIntegrationUtils } from "@/utils/pointsIntegration";
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
  CreditCard,
  RefreshCw,
  MapPin,
  Info
} from "lucide-react";

const PointsSystemSection = () => {
  const { user } = useAuth();
  const { balance, transactions, loading, pointsSummary } = usePoints(user?.id || null);
  const { getAllProvincialRates } = useBookingCost();

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
      case 'subscription_bonus':
        return <Gift className="h-4 w-4 text-blue-600" />;
      case 'booking_earning':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'booking_payment':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'booking_refund':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      default:
        return <Coins className="h-4 w-4 text-gray-600" />;
    }
  };

  // Updated data according to the requirements document
  const earnPointsData = [
    {
      icon: Home,
      title: "Ser Host",
      description: "Gana puntos cada vez que hospedas a un corredor",
      points: "+ 40 Puntos por noche",
      color: "text-green-600"
    },
    {
      icon: Plus,
      title: "Agregar propiedad",
      description: "Por agregar tu propiedad y ser revisada correctamente",
      points: "+ 30 puntos",
      color: "text-blue-600"
    },
    {
      icon: Trophy,
      title: "Agregar carreras",
      description: "Por cada carrera agregada",
      points: "+ 20 puntos",
      color: "text-yellow-600"
    },
    {
      icon: Star,
      title: "Rating 5 estrellas",
      description: "Por cada reseña valorada con 5 estrellas que recibas",
      points: "+ 15 puntos",
      color: "text-orange-600"
    },
    {
      icon: CreditCard,
      title: "Nuevo suscriptor",
      description: "Bonus por suscribirte/pagar la cuota anual por primera vez",
      points: "+ 30 puntos",
      color: "text-purple-600"
    },
    {
      icon: RefreshCw,
      title: "Renovación de suscripción anual",
      description: "Bonus por renovar tu suscripción anual",
      points: "+ 50 puntos",
      color: "text-cyan-600"
    },
    {
      icon: X,
      title: "Cancelación reserva como host",
      description: "Penalización: pierdes los mismos puntos que pagó el guest (o 100 puntos por defecto)",
      points: "- Puntos pagados",
      color: "text-red-600"
    },
    {
      icon: RefreshCw,
      title: "Solicitud de reserva cancelada por el host",
      description: "Solicitud de reserva enviada como guest, aceptada por el host y luego cancelada: recibes los puntos de la reserva de vuelta",
      points: "+ Puntos devueltos",
      color: "text-green-600"
    },
    {
      icon: X,
      title: "No responder solicitud como host",
      description: "No responder (aceptar/rechazar) a una solicitud recibida para una de tus carreras como host dentro del plazo establecido límite resultará en una penalización de 30 puntos",
      points: "- 30 puntos",
      color: "text-red-600"
    },
    {
      icon: Plus,
      title: "Compensación por falta de respuesta del host",
      description: "No recibir respuesta a una solicitud enviada como guest dentro del plazo establecido límite será recompensado por las molestias con 30 puntos extra",
      points: "+ 30 puntos",
      color: "text-green-600"
    }
  ];

  const spendPointsData = [
    {
      icon: Calendar,
      title: "Reservar Estancias",
      description: "Usa puntos para reservar alojamiento con hosts. El costo depende de la provincia donde se realiza la carrera",
      points: "Ver tabla provincial",
      color: "text-red-600"
    }
  ];

  // Get provincial points for display
  const provincialPoints = PointsIntegrationUtils.getProvincialPointsForDisplay();

  return (
    <div className="space-y-6">
      {/* Current Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Coins className="h-5 w-5 mr-2" />
              Mi Balance de Puntos
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {PointsIntegrationUtils.formatPoints(balance)} puntos
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Ganado</p>
              <p className="text-lg font-semibold text-green-600">
                +{PointsIntegrationUtils.formatPoints(pointsSummary.total_earned)}
              </p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Gastado</p>
              <p className="text-lg font-semibold text-red-600">
                -{PointsIntegrationUtils.formatPoints(pointsSummary.total_spent)}
              </p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">Penalizaciones</p>
              <p className="text-lg font-semibold text-orange-600">
                -{PointsIntegrationUtils.formatPoints(pointsSummary.total_penalties)}
              </p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Balance Actual</p>
              <p className="text-lg font-semibold text-blue-600">
                {PointsIntegrationUtils.formatPoints(pointsSummary.current_balance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Coins className="h-5 w-5 mr-2" />
            Sistema de Puntos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="how-it-works">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="how-it-works">Cómo Funciona</TabsTrigger>
              <TabsTrigger value="provincial-rates">Tarifas Provinciales</TabsTrigger>
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

              {/* Key Points - Updated according to requirements */}
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-1" />
                  Puntos Clave
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Todos los puntos se otorgan automáticamente cuando cumples los requisitos</li>
                  <li>• Los puntos ganados por hosting y actividades no expiran</li>
                  <li>• El costo de reservas varía según la provincia de la carrera</li>
                  <li>• Los hosts que cancelen pierden puntos como penalización</li>
                  <li>• Fomenta intercambios auténticos entre corredores</li>
                  <li>• No responder a una solicitud recibida dentro del plazo establecido límite penaliza restando puntos</li>
                  <li>• Las buenas reseñas suman puntos</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="provincial-rates" className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                  Puntos por Noche según Provincia
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  El costo de las reservas se calcula según la provincia donde se realiza la carrera:
                </p>
                
                <div className="grid gap-3">
                  {provincialPoints.map((province) => (
                    <div key={province.province} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${PointsIntegrationUtils.getTierColor(province.tier).split(' ')[1]}`}></div>
                        <span className="font-medium">{province.province}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${PointsIntegrationUtils.getTierColor(province.tier)}`}
                        >
                          {province.tier.charAt(0).toUpperCase() + province.tier.slice(1)}
                        </Badge>
                        <span className="font-semibold">
                          {province.pointsPerNight} pts/noche
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Categorías de Provincias</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-200"></div>
                      <span>Baja demanda: 20 pts/noche</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-200"></div>
                      <span>Demanda media: 30 pts/noche</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-orange-200"></div>
                      <span>Alta demanda: 40 pts/noche</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-200"></div>
                      <span>Premium: 60 pts/noche</span>
                    </div>
                  </div>
                </div>
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
                            <div className="flex items-center space-x-2">
                              <p className="text-sm text-gray-600">{formatDate(transaction.created_at)}</p>
                              <Badge variant="outline" className="text-xs">
                                {PointsIntegrationUtils.getTransactionTypeDisplayName(transaction.type)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className={`font-semibold ${PointsIntegrationUtils.getPointsColor(transaction.amount)}`}>
                          {transaction.amount > 0 ? '+' : ''}{PointsIntegrationUtils.formatPoints(transaction.amount)} pts
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
