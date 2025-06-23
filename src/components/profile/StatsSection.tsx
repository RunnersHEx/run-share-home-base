
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { Trophy, Star, Award, Coins } from "lucide-react";

const StatsSection = () => {
  const { profile } = useProfile();

  const stats = [
    {
      icon: <Trophy className="h-6 w-6 text-blue-600" />,
      label: "Experiencias como Host",
      value: profile?.total_host_experiences || 0,
      color: "text-blue-600"
    },
    {
      icon: <Star className="h-6 w-6 text-orange-600" />,
      label: "Experiencias como Guest",
      value: profile?.total_guest_experiences || 0,
      color: "text-orange-600"
    },
    {
      icon: <Award className="h-6 w-6 text-green-600" />,
      label: "Rating Promedio",
      value: profile?.average_rating ? `${profile.average_rating.toFixed(1)}/5.0` : "Sin calificar",
      color: "text-green-600"
    },
    {
      icon: <Coins className="h-6 w-6 text-yellow-600" />,
      label: "Balance de Puntos",
      value: profile?.points_balance || 0,
      color: "text-yellow-600"
    }
  ];

  const badges = profile?.badges || [];
  const predefinedBadges = [
    { id: 'early-adopter', name: 'Early Adopter', description: 'Entre los primeros usuarios', color: 'bg-purple-100 text-purple-800' },
    { id: 'super-host', name: 'Super Host', description: 'Host excepcional', color: 'bg-blue-100 text-blue-800' },
    { id: 'verified-runner', name: 'Runner Verificado', description: 'Perfil completamente verificado', color: 'bg-green-100 text-green-800' },
    { id: 'community-hero', name: 'Héroe de la Comunidad', description: 'Contribución excepcional', color: 'bg-red-100 text-red-800' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logros y Estadísticas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                {stat.icon}
                <span className="text-sm font-medium text-gray-700">{stat.label}</span>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Badges ganados */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Badges Ganados</h4>
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {badges.map((badgeId) => {
                const badge = predefinedBadges.find(b => b.id === badgeId);
                if (!badge) return null;
                return (
                  <Badge key={badgeId} className={badge.color}>
                    <Award className="h-3 w-3 mr-1" />
                    {badge.name}
                  </Badge>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              Aún no has ganado ningún badge. ¡Completa tu perfil y participa en la comunidad para ganar tus primeros logros!
            </p>
          )}
        </div>

        {/* Próximos badges */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Próximos Logros</h4>
          <div className="space-y-2">
            {predefinedBadges
              .filter(badge => !badges.includes(badge.id))
              .slice(0, 2)
              .map((badge) => (
                <div key={badge.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Award className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-700">{badge.name}</p>
                      <p className="text-sm text-gray-500">{badge.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline">Próximamente</Badge>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsSection;
