import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  Star, 
  Clock,
  DollarSign,
  Target,
  Activity,
  BarChart3,
  PieChart
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings } from "@/hooks/useBookings";
import { supabase } from "@/integrations/supabase/client";

interface HostAnalyticsData {
  totalBookings: number;
  acceptanceRate: number;
  averageResponseTime: number;
  totalEarnings: number;
  averageRating: number;
  repeatGuests: number;
  monthlyTrends: Array<{
    month: string;
    bookings: number;
    earnings: number;
    rating: number;
  }>;
  responseTimeBreakdown: {
    under1h: number;
    under6h: number;
    under24h: number;
    over24h: number;
  };
  seasonalPerformance: Array<{
    quarter: string;
    bookings: number;
    revenue: number;
    occupancyRate: number;
  }>;
  topPerformingProperties: Array<{
    propertyId: string;
    propertyName: string;
    bookings: number;
    rating: number;
    earnings: number;
  }>;
  guestFeedback: Array<{
    category: string;
    score: number;
    trend: 'up' | 'down' | 'stable';
  }>;
}

const HostAnalytics = () => {
  const { user } = useAuth();
  const { bookings, stats, loading } = useBookings({ role: 'host' });
  const [analyticsData, setAnalyticsData] = useState<HostAnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    if (user && bookings) {
      generateAnalytics();
    }
  }, [user, bookings]);

  const generateAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      // Generate analytics based on booking data
      const analytics = await processHostAnalytics();
      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Error generating analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const processHostAnalytics = async (): Promise<HostAnalyticsData> => {
    if (!user || !bookings) {
      throw new Error('No data available');
    }

    // Get additional data from database
    const { data: properties } = await supabase
      .from('properties')
      .select('id, title, total_bookings, average_rating, points_earned')
      .eq('owner_id', user.id);

    const { data: reviews } = await supabase
      .from('booking_reviews')
      .select('rating, categories, created_at')
      .eq('reviewee_id', user.id)
      .eq('review_type', 'guest_to_host');

    // Calculate metrics
    const hostBookings = bookings.filter(b => b.host_id === user.id);
    const completedBookings = hostBookings.filter(b => b.status === 'completed');
    const acceptedBookings = hostBookings.filter(b => ['accepted', 'confirmed', 'completed'].includes(b.status));
    
    // Response time calculation
    const responseTimeBreakdown = calculateResponseTimeBreakdown(hostBookings);
    
    // Monthly trends
    const monthlyTrends = calculateMonthlyTrends(hostBookings, reviews || []);
    
    // Seasonal performance
    const seasonalPerformance = calculateSeasonalPerformance(hostBookings);
    
    // Top performing properties
    const topPerformingProperties = (properties || [])
      .sort((a, b) => (b.points_earned || 0) - (a.points_earned || 0))
      .slice(0, 5)
      .map(p => ({
        propertyId: p.id,
        propertyName: p.title,
        bookings: p.total_bookings || 0,
        rating: p.average_rating || 0,
        earnings: p.points_earned || 0
      }));

    // Guest feedback analysis
    const guestFeedback = analyzeGuestFeedback(reviews || []);

    // Calculate repeat guests
    const guestIds = completedBookings.map(b => b.guest_id);
    const uniqueGuests = new Set(guestIds);
    const repeatGuests = guestIds.length - uniqueGuests.size;

    return {
      totalBookings: hostBookings.length,
      acceptanceRate: stats.acceptanceRate,
      averageResponseTime: stats.averageResponseTime,
      totalEarnings: stats.totalPointsEarned,
      averageRating: reviews?.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
      repeatGuests,
      monthlyTrends,
      responseTimeBreakdown,
      seasonalPerformance,
      topPerformingProperties,
      guestFeedback
    };
  };

  const calculateResponseTimeBreakdown = (bookings: any[]) => {
    const respondedBookings = bookings.filter(b => b.accepted_at || b.rejected_at);
    const breakdown = { under1h: 0, under6h: 0, under24h: 0, over24h: 0 };

    respondedBookings.forEach(booking => {
      const createdAt = new Date(booking.created_at);
      const respondedAt = new Date(booking.accepted_at || booking.rejected_at);
      const responseTimeHours = (respondedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (responseTimeHours <= 1) breakdown.under1h++;
      else if (responseTimeHours <= 6) breakdown.under6h++;
      else if (responseTimeHours <= 24) breakdown.under24h++;
      else breakdown.over24h++;
    });

    return breakdown;
  };

  const calculateMonthlyTrends = (bookings: any[], reviews: any[]) => {
    const last12Months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthBookings = bookings.filter(b => {
        const bookingDate = new Date(b.created_at);
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      });

      const monthReviews = reviews.filter(r => {
        const reviewDate = new Date(r.created_at);
        return reviewDate >= monthStart && reviewDate <= monthEnd;
      });

      const monthEarnings = monthBookings
        .filter(b => ['accepted', 'confirmed', 'completed'].includes(b.status))
        .reduce((sum, b) => sum + (b.points_cost || 0), 0);

      const monthRating = monthReviews.length > 0
        ? monthReviews.reduce((sum, r) => sum + r.rating, 0) / monthReviews.length
        : 0;

      last12Months.push({
        month: monthDate.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        bookings: monthBookings.length,
        earnings: monthEarnings,
        rating: monthRating
      });
    }

    return last12Months;
  };

  const calculateSeasonalPerformance = (bookings: any[]) => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const currentYear = new Date().getFullYear();

    return quarters.map((quarter, index) => {
      const quarterStart = new Date(currentYear, index * 3, 1);
      const quarterEnd = new Date(currentYear, (index + 1) * 3, 0);

      const quarterBookings = bookings.filter(b => {
        const bookingDate = new Date(b.created_at);
        return bookingDate >= quarterStart && bookingDate <= quarterEnd;
      });

      const revenue = quarterBookings
        .filter(b => ['accepted', 'confirmed', 'completed'].includes(b.status))
        .reduce((sum, b) => sum + (b.points_cost || 0), 0);

      return {
        quarter,
        bookings: quarterBookings.length,
        revenue,
        occupancyRate: Math.min(100, (quarterBookings.length / 30) * 100) // Simplified calculation
      };
    });
  };

  const analyzeGuestFeedback = (reviews: any[]) => {
    if (reviews.length === 0) return [];

    const recentReviews = reviews.slice(-10); // Last 10 reviews
    const olderReviews = reviews.slice(-20, -10); // Previous 10 reviews

    const categories = ['cleanliness', 'communication', 'location', 'value', 'accuracy'];
    
    return categories.map(category => {
      const recentScore = recentReviews.length > 0
        ? recentReviews.reduce((sum, r) => sum + (r.categories?.[category] || r.rating), 0) / recentReviews.length
        : 0;

      const olderScore = olderReviews.length > 0
        ? olderReviews.reduce((sum, r) => sum + (r.categories?.[category] || r.rating), 0) / olderReviews.length
        : 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (recentScore > olderScore + 0.2) trend = 'up';
      else if (recentScore < olderScore - 0.2) trend = 'down';

      return {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        score: recentScore,
        trend
      };
    });
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const formatCurrency = (points: number) => `${points} puntos`;

  if (loading || loadingAnalytics) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay suficientes datos</h3>
        <p className="text-gray-600">Necesitas al menos algunas reservas para ver analytics detallados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics de Host</h1>
        <p className="text-gray-600">Insights sobre tu rendimiento como anfitrión</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reservas Totales</p>
                <p className="text-2xl font-bold">{analyticsData.totalBookings}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tasa Aceptación</p>
                <p className="text-2xl font-bold">{analyticsData.acceptanceRate}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tiempo Respuesta</p>
                <p className="text-2xl font-bold">{analyticsData.averageResponseTime}h</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Puntos Ganados</p>
                <p className="text-2xl font-bold">{analyticsData.totalEarnings}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rating Promedio</p>
                <p className="text-2xl font-bold">{analyticsData.averageRating.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="properties">Propiedades</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          {/* Response Time Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Tiempo de Respuesta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Menos de 1 hora</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={(analyticsData.responseTimeBreakdown.under1h / analyticsData.totalBookings) * 100} className="w-32" />
                    <span className="text-sm font-medium">{analyticsData.responseTimeBreakdown.under1h}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">1-6 horas</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={(analyticsData.responseTimeBreakdown.under6h / analyticsData.totalBookings) * 100} className="w-32" />
                    <span className="text-sm font-medium">{analyticsData.responseTimeBreakdown.under6h}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">6-24 horas</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={(analyticsData.responseTimeBreakdown.under24h / analyticsData.totalBookings) * 100} className="w-32" />
                    <span className="text-sm font-medium">{analyticsData.responseTimeBreakdown.under24h}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Más de 24 horas</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={(analyticsData.responseTimeBreakdown.over24h / analyticsData.totalBookings) * 100} className="w-32" />
                    <span className="text-sm font-medium">{analyticsData.responseTimeBreakdown.over24h}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seasonal Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Trimestre</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {analyticsData.seasonalPerformance.map((quarter) => (
                  <div key={quarter.quarter} className="text-center p-4 border rounded-lg">
                    <h3 className="font-semibold">{quarter.quarter}</h3>
                    <p className="text-2xl font-bold text-blue-600">{quarter.bookings}</p>
                    <p className="text-sm text-gray-600">reservas</p>
                    <p className="text-sm font-medium">{formatCurrency(quarter.revenue)}</p>
                    <p className="text-xs text-gray-500">{quarter.occupancyRate.toFixed(1)}% ocupación</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.guestFeedback.map((feedback) => (
                  <div key={feedback.category} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{feedback.category}</span>
                      {getTrendIcon(feedback.trend)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={(feedback.score / 5) * 100} className="w-24" />
                      <span className="font-semibold">{feedback.score.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Propiedades Top</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.topPerformingProperties.map((property, index) => (
                  <div key={property.propertyId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{property.propertyName}</p>
                        <p className="text-sm text-gray-600">{property.bookings} reservas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(property.earnings)}</p>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm">{property.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias Mensuales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analyticsData.monthlyTrends.slice(-3).map((month) => (
                    <div key={month.month} className="text-center p-4 border rounded-lg">
                      <h3 className="font-semibold">{month.month}</h3>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">{month.bookings}</span> reservas
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">{formatCurrency(month.earnings)}</span>
                        </p>
                        <div className="flex items-center justify-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-sm">{month.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HostAnalytics;
