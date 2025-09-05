import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Trophy, 
  Star, 
  Award, 
  Coins, 
  Calendar,
  Home,
  MapPin,
  TrendingUp,
  Target,
  Clock,
  Users,
  Medal,
  CheckCircle,
  Gift,
  Zap,
  Heart,
  Sparkles,
  Crown,
  Shield
} from "lucide-react";
import { toast } from "sonner";

interface UserStats {
  totalBookings: number;
  hostBookings: number;
  guestBookings: number;
  completedBookings: number;
  totalReviews: number;
  averageHostRating: number;
  averageGuestRating: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  totalProperties: number;
  totalRaces: number;
  thisYearBookings: number;
  thisMonthBookings: number;
  joinDate: string;
  daysActive: number;
  verificationStatus: string;
  lastActiveDate: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
  category: 'milestone' | 'experience' | 'social' | 'points' | 'time' | 'special';
  color: string;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const StatsSection = () => {
  const { profile } = useProfile();
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch comprehensive user statistics
  const fetchUserStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all bookings data
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`);

      // Fetch reviews for this user
      const { data: reviews } = await supabase
        .from('booking_reviews')
        .select('*')
        .eq('reviewee_id', user.id);

      // Fetch reviews BY this user
      const { data: reviewsByUser } = await supabase
        .from('booking_reviews')
        .select('*')
        .eq('reviewer_id', user.id);

      // Fetch points transactions
      const { data: pointsTransactions } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', user.id);

      // Fetch user's properties
      const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id);

      // Fetch user's races
      const { data: races } = await supabase
        .from('races')
        .select('*')
        .eq('host_id', user.id);

      // Process data
      const now = new Date();
      const thisYear = now.getFullYear();
      const thisMonth = now.getMonth();
      const joinDate = user.created_at || new Date().toISOString();

      const hostBookings = bookings?.filter(b => b.host_id === user.id) || [];
      const guestBookings = bookings?.filter(b => b.guest_id === user.id) || [];
      const completedBookings = bookings?.filter(b => b.status === 'completed') || [];
      
      const thisYearBookings = bookings?.filter(b => 
        new Date(b.created_at).getFullYear() === thisYear
      ).length || 0;

      const thisMonthBookings = bookings?.filter(b => {
        const bookingDate = new Date(b.created_at);
        return bookingDate.getFullYear() === thisYear && bookingDate.getMonth() === thisMonth;
      }).length || 0;

      const totalPointsEarned = pointsTransactions?.filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0) || 0;
      
      const totalPointsSpent = pointsTransactions?.filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

      const hostReviews = reviews?.filter(r => r.review_type === 'host') || [];
      const guestReviews = reviews?.filter(r => r.review_type === 'guest') || [];
      
      const averageHostRating = hostReviews.length > 0 
        ? hostReviews.reduce((sum, r) => sum + r.rating, 0) / hostReviews.length 
        : 0;
      
      const averageGuestRating = guestReviews.length > 0 
        ? guestReviews.reduce((sum, r) => sum + r.rating, 0) / guestReviews.length 
        : 0;

      const daysActive = Math.floor((now.getTime() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24));

      const stats: UserStats = {
        totalBookings: bookings?.length || 0,
        hostBookings: hostBookings.length,
        guestBookings: guestBookings.length,
        completedBookings: completedBookings.length,
        totalReviews: (reviews?.length || 0) + (reviewsByUser?.length || 0),
        averageHostRating,
        averageGuestRating,
        totalPointsEarned,
        totalPointsSpent,
        totalProperties: properties?.length || 0,
        totalRaces: races?.length || 0,
        thisYearBookings,
        thisMonthBookings,
        joinDate,
        daysActive,
        verificationStatus: profile?.verification_status || 'pending',
        lastActiveDate: now.toISOString()
      };

      setUserStats(stats);
      calculateAchievements(stats);

    } catch (error) {
      console.error('Error fetching user stats:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  // Function to calculate achievements based on user stats
  const calculateAchievements = (stats: UserStats) => {
    const achievementsList: Achievement[] = [
      // Milestone Achievements
      {
        id: 'first-booking',
        name: 'Primera Reserva',
        description: 'Completa tu primera reserva',
        icon: <Star className="h-4 w-4" />,
        category: 'milestone',
        color: 'bg-blue-100 text-blue-800',
        progress: Math.min(stats.totalBookings, 1),
        maxProgress: 1,
        isUnlocked: stats.totalBookings >= 1,
        rarity: 'common'
      },
      {
        id: 'booking-veteran',
        name: 'Veterano',
        description: 'Realiza 10 reservas',
        icon: <Medal className="h-4 w-4" />,
        category: 'milestone',
        color: 'bg-purple-100 text-purple-800',
        progress: Math.min(stats.totalBookings, 10),
        maxProgress: 10,
        isUnlocked: stats.totalBookings >= 10,
        rarity: 'rare'
      },
      {
        id: 'booking-master',
        name: 'Maestro de Reservas',
        description: 'Completa 50 reservas',
        icon: <Crown className="h-4 w-4" />,
        category: 'milestone',
        color: 'bg-yellow-100 text-yellow-800',
        progress: Math.min(stats.totalBookings, 50),
        maxProgress: 50,
        isUnlocked: stats.totalBookings >= 50,
        rarity: 'epic'
      },

      // Host Achievements
      {
        id: 'first-host',
        name: 'Primer Host',
        description: 'Hospeda a tu primer huésped',
        icon: <Home className="h-4 w-4" />,
        category: 'experience',
        color: 'bg-green-100 text-green-800',
        progress: Math.min(stats.hostBookings, 1),
        maxProgress: 1,
        isUnlocked: stats.hostBookings >= 1,
        rarity: 'common'
      },
      {
        id: 'super-host',
        name: 'Super Host',
        description: 'Alcanza una calificación promedio de 4.5+ como host',
        icon: <Sparkles className="h-4 w-4" />,
        category: 'experience',
        color: 'bg-pink-100 text-pink-800',
        progress: Math.min(stats.averageHostRating * 10, 45),
        maxProgress: 45,
        isUnlocked: stats.averageHostRating >= 4.5,
        rarity: 'epic'
      },
      {
        id: 'property-owner',
        name: 'Propietario',
        description: 'Registra tu primera propiedad',
        icon: <MapPin className="h-4 w-4" />,
        category: 'milestone',
        color: 'bg-indigo-100 text-indigo-800',
        progress: Math.min(stats.totalProperties, 1),
        maxProgress: 1,
        isUnlocked: stats.totalProperties >= 1,
        rarity: 'common'
      },

      // Points Achievements
      {
        id: 'points-collector',
        name: 'Coleccionista',
        description: 'Gana 1000 puntos',
        icon: <Coins className="h-4 w-4" />,
        category: 'points',
        color: 'bg-yellow-100 text-yellow-800',
        progress: Math.min(stats.totalPointsEarned, 1000),
        maxProgress: 1000,
        isUnlocked: stats.totalPointsEarned >= 1000,
        rarity: 'common'
      },
      {
        id: 'points-master',
        name: 'Maestro de Puntos',
        description: 'Gana 10,000 puntos',
        icon: <Trophy className="h-4 w-4" />,
        category: 'points',
        color: 'bg-orange-100 text-orange-800',
        progress: Math.min(stats.totalPointsEarned, 10000),
        maxProgress: 10000,
        isUnlocked: stats.totalPointsEarned >= 10000,
        rarity: 'epic'
      },

      // Social Achievements
      {
        id: 'reviewer',
        name: 'Crítico',
        description: 'Escribe 5 reseñas',
        icon: <Heart className="h-4 w-4" />,
        category: 'social',
        color: 'bg-red-100 text-red-800',
        progress: Math.min(stats.totalReviews, 5),
        maxProgress: 5,
        isUnlocked: stats.totalReviews >= 5,
        rarity: 'common'
      },

      // Time-based Achievements
      {
        id: 'early-adopter',
        name: 'Early Adopter',
        description: 'Uno de los primeros usuarios',
        icon: <Zap className="h-4 w-4" />,
        category: 'special',
        color: 'bg-purple-100 text-purple-800',
        progress: stats.daysActive >= 30 ? 1 : 0,
        maxProgress: 1,
        isUnlocked: stats.daysActive >= 30,
        rarity: 'rare'
      },

      // Verification Achievement
      {
        id: 'verified-user',
        name: 'Usuario Verificado',
        description: 'Completa el proceso de verificación',
        icon: <Shield className="h-4 w-4" />,
        category: 'special',
        color: 'bg-green-100 text-green-800',
        progress: stats.verificationStatus === 'verified' ? 1 : 0,
        maxProgress: 1,
        isUnlocked: stats.verificationStatus === 'verified',
        rarity: 'common'
      },

      // Race Achievements
      {
        id: 'race-host',
        name: 'Anfitrión de Carreras',
        description: 'Organiza tu primera carrera',
        icon: <Target className="h-4 w-4" />,
        category: 'experience',
        color: 'bg-cyan-100 text-cyan-800',
        progress: Math.min(stats.totalRaces, 1),
        maxProgress: 1,
        isUnlocked: stats.totalRaces >= 1,
        rarity: 'rare'
      },

      // Activity Achievements
      {
        id: 'monthly-active',
        name: 'Activo del Mes',
        description: 'Realiza 3+ reservas este mes',
        icon: <Calendar className="h-4 w-4" />,
        category: 'time',
        color: 'bg-teal-100 text-teal-800',
        progress: Math.min(stats.thisMonthBookings, 3),
        maxProgress: 3,
        isUnlocked: stats.thisMonthBookings >= 3,
        rarity: 'rare'
      }
    ];

    // Sort achievements: unlocked first, then by rarity
    const sortedAchievements = achievementsList.sort((a, b) => {
      if (a.isUnlocked !== b.isUnlocked) {
        return a.isUnlocked ? -1 : 1;
      }
      const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });

    setAchievements(sortedAchievements);
  };

  useEffect(() => {
    fetchUserStats();
  }, [user, profile]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Logros y Estadísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      icon: <Trophy className="h-6 w-6 text-blue-600" />,
      label: "Experiencias como Host",
      value: userStats?.hostBookings || 0,
      color: "text-blue-600",
      sublabel: `${userStats?.averageHostRating > 0 ? userStats.averageHostRating.toFixed(1) : 'N/A'} ⭐ promedio`
    },
    {
      icon: <Star className="h-6 w-6 text-orange-600" />,
      label: "Experiencias como Guest",
      value: userStats?.guestBookings || 0,
      color: "text-orange-600",
      sublabel: `${userStats?.averageGuestRating > 0 ? userStats.averageGuestRating.toFixed(1) : 'N/A'} ⭐ promedio`
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      label: "Reservas Completadas",
      value: userStats?.completedBookings || 0,
      color: "text-green-600",
      sublabel: `${userStats?.thisYearBookings || 0} este año`
    },
    {
      icon: <Coins className="h-6 w-6 text-yellow-600" />,
      label: "Puntos Totales Ganados",
      value: userStats?.totalPointsEarned || 0,
      color: "text-yellow-600",
      sublabel: `${profile?.points_balance || 0} balance actual`
    },
    {
      icon: <Home className="h-6 w-6 text-purple-600" />,
      label: "Propiedades Registradas",
      value: userStats?.totalProperties || 0,
      color: "text-purple-600",
      sublabel: `${userStats?.totalRaces || 0} carreras organizadas`
    },
    {
      icon: <Clock className="h-6 w-6 text-indigo-600" />,
      label: "Días Activo",
      value: userStats?.daysActive || 0,
      color: "text-indigo-600",
      sublabel: `Desde ${userStats?.joinDate ? new Date(userStats.joinDate).toLocaleDateString() : 'N/A'}`
    }
  ];

  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const inProgressAchievements = achievements.filter(a => !a.isUnlocked && a.progress > 0);
  const lockedAchievements = achievements.filter(a => !a.isUnlocked && a.progress === 0);

  const rarityColors = {
    common: 'bg-gray-100 text-gray-800',
    rare: 'bg-blue-100 text-blue-800',
    epic: 'bg-purple-100 text-purple-800',
    legendary: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-600" />
          Logros y Estadísticas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
            <TabsTrigger value="achievements">
              Logros ({unlockedAchievements.length}/{achievements.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            {/* Main Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border">
                  <div className="flex items-center space-x-3 mb-2">
                    {stat.icon}
                    <span className="text-sm font-medium text-gray-700">{stat.label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${stat.color} mb-1`}>
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{stat.sublabel}</p>
                </div>
              ))}
            </div>

            {/* Quick Achievement Preview */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                Logros Recientes
              </h4>
              <div className="flex flex-wrap gap-2">
                {unlockedAchievements.slice(0, 5).map((achievement) => (
                  <Badge key={achievement.id} className={achievement.color}>
                    {achievement.icon}
                    <span className="ml-1">{achievement.name}</span>
                  </Badge>
                ))}
                {unlockedAchievements.length === 0 && (
                  <p className="text-gray-500 text-sm">
                    ¡Completa acciones para desbloquear tus primeros logros!
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            {/* Unlocked Achievements */}
            {unlockedAchievements.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  Logros Desbloqueados ({unlockedAchievements.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unlockedAchievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          {achievement.icon}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {achievement.name}
                            <Badge className={rarityColors[achievement.rarity]} variant="outline">
                              {achievement.rarity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                        </div>
                      </div>
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* In Progress Achievements */}
            {inProgressAchievements.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  En Progreso ({inProgressAchievements.length})
                </h4>
                <div className="space-y-3">
                  {inProgressAchievements.map((achievement) => (
                    <div key={achievement.id} className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            {achievement.icon}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {achievement.name}
                              <Badge className={rarityColors[achievement.rarity]} variant="outline">
                                {achievement.rarity}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{achievement.description}</p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-blue-600">
                          {achievement.progress}/{achievement.maxProgress}
                        </span>
                      </div>
                      <Progress 
                        value={(achievement.progress / achievement.maxProgress) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Locked Achievements */}
            {lockedAchievements.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="h-5 w-5 text-gray-600" />
                  Por Desbloquear ({lockedAchievements.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {lockedAchievements.slice(0, 6).map((achievement) => (
                    <div key={achievement.id} className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50">
                      <div className="p-2 bg-gray-200 rounded-full opacity-60">
                        {achievement.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-700 flex items-center gap-2">
                          {achievement.name}
                          <Badge className={rarityColors[achievement.rarity]} variant="outline">
                            {achievement.rarity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievement Summary */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Progreso Total</h4>
                  <p className="text-sm text-gray-600">
                    {unlockedAchievements.length} de {achievements.length} logros completados
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round((unlockedAchievements.length / achievements.length) * 100)}%
                  </p>
                  <p className="text-sm text-gray-500">Completado</p>
                </div>
              </div>
              <Progress 
                value={(unlockedAchievements.length / achievements.length) * 100} 
                className="mt-3 h-3"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StatsSection;