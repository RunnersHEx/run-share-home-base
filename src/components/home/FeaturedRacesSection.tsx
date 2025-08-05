import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPin, Calendar, Star, Clock, Trophy, Heart, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { RaceService } from "@/services/raceService";
import { ReviewsService } from "@/services/reviews/properReviewsService";
import { RaceDetailModal } from "@/components/discover/RaceDetailModal";

interface FeaturedRacesSectionProps {
  onAuthModal: (mode: "login" | "register") => void;
}

interface FeaturedRace {
  id: string;
  name: string;
  location: string;
  province?: string;
  date: string;
  daysUntil: number;
  modalities: string[];
  distances: string[];
  terrainProfile: string[];
  imageUrl: string;
  images?: {
    id: string;
    image_url: string;
    caption?: string;
    category: string;
    display_order: number;
  }[];
  host: {
    id: string;
    name: string;
    rating: number;
    verified: boolean;
    imageUrl: string;
  };
  pointsCost: number;
  available: boolean;
  highlights: string;
  official_website?: string;
  maxGuests?: number;
  property_info?: any;
}

// Utility functions (same as in RaceCard)
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getModalityBadgeColor = (modality: string) => {
  return modality === 'road' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
};

const getDistanceBadgeColor = (distance: string) => {
  const colors = {
    'ultra': 'bg-red-100 text-red-800',
    'marathon': 'bg-orange-100 text-orange-800',
    'half_marathon': 'bg-yellow-100 text-yellow-800',
    '20k': 'bg-green-100 text-green-800',
    '15k': 'bg-blue-100 text-blue-800',
    '10k': 'bg-indigo-100 text-indigo-800',
    '5k': 'bg-purple-100 text-purple-800'
  };
  return colors[distance as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getDistanceLabel = (distance: string) => {
  const labels = {
    'ultra': 'ULTRA',
    'marathon': 'MARATÓN',
    'half_marathon': 'MEDIA MARATÓN',
    '20k': '20K',
    '15k': '15K',
    '10k': '10K',
    '5k': '5K'
  };
  return labels[distance as keyof typeof labels] || distance.toUpperCase();
};

// Featured Race Card Component (same as RaceCard but without save functionality)
const FeaturedRaceCard = ({ race, onViewDetails, onAuthModal }: {
  race: FeaturedRace;
  onViewDetails: () => void;
  onAuthModal: (mode: "login" | "register") => void;
}) => {
  const { user } = useAuth();
  const [dynamicRating, setDynamicRating] = useState(race.host.rating);
  const [reviewCount, setReviewCount] = useState(0);
  const [loadingRating, setLoadingRating] = useState(true);

  useEffect(() => {
    fetchHostRating();
  }, [race.host.id]);

  const fetchHostRating = async () => {
    try {
      const stats = await ReviewsService.getRatingStatsForHost(race.host.id);
      setDynamicRating(stats.averageRating);
      setReviewCount(stats.totalReviews);
    } catch (error) {
      console.error('Error fetching host rating for featured race card:', error);
      // Keep the original rating as fallback
      setDynamicRating(race.host.rating);
      setReviewCount(0);
    } finally {
      setLoadingRating(false);
    }
  };

  const handleViewDetailsClick = () => {
    if (!user) {
      toast.error("Para continuar explorando esta experiencia, necesitas registrarte.");
      onAuthModal("register");
      return;
    }
    onViewDetails();
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="relative">
        <img 
          src={race.imageUrl} 
          alt={race.name}
          className="w-full h-48 object-cover"
        />
        
        {/* Points Badge - Original Style */}
        <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 text-sm font-semibold text-runner-blue-600">
          {race.pointsCost} puntos
        </div>
        
        {/* Countdown Badge */}
        {race.daysUntil > 0 && (
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-[#1E40AF] text-white">
              <Clock className="w-3 h-3 mr-1" />
              En {race.daysUntil} días
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2">{race.name}</h3>
          
          {race.province && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="tracking-wide">Provincia: <span className="font-medium tracking-normal">{race.province}</span></span>
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(race.date)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Race Characteristics */}
        <div className="space-y-3">
          {/* Modalities */}
          <div className="flex flex-wrap gap-1">
            {race.modalities.map((modality) => (
              <Badge key={modality} className={getModalityBadgeColor(modality)}>
                {modality === 'road' ? 'Ruta/Asfalto' : 'Trail/Montaña'}
              </Badge>
            ))}
          </div>
          
          {/* Distances with proper colors */}
          <div className="flex flex-wrap gap-1">
            {race.distances.slice(0, 2).map((distance) => (
              <Badge key={distance} className={getDistanceBadgeColor(distance)}>
                {getDistanceLabel(distance)}
              </Badge>
            ))}
            {race.distances.length > 2 && (
              <Badge className="bg-gray-100 text-gray-800">
                +{race.distances.length - 2} más
              </Badge>
            )}
          </div>

          {/* Highlights - Special phrase */}
          <p className="text-sm text-gray-600 line-clamp-2 italic">
            "{race.highlights}"
          </p>

          {/* Host Info */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-2">
              <img 
                src={race.host.imageUrl} 
                alt={race.host.name}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span className="text-sm font-medium">{race.host.name}</span>
                  {race.host.verified && (
                    <CheckCircle className="w-3 h-3 ml-1 text-green-600" />
                  )}
                </div>
                <div className="flex items-center">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-xs ml-1 text-gray-500">
                    {loadingRating ? (
                      <span className="animate-pulse">...</span>
                    ) : reviewCount > 0 ? (
                      `${dynamicRating.toFixed(1)} (${reviewCount})`
                    ) : (
                      'Sin reseñas'
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-sm text-runner-green-600 font-medium">
              {race.available ? 'Disponible' : 'No disponible'}
            </div>
          </div>

          {/* Separator and Button */}
          <div className="pt-3 border-t">
            <Button 
              className="w-full bg-runner-blue-600 hover:bg-runner-blue-700"
              onClick={handleViewDetailsClick}
            >
              Ver Detalles
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const FeaturedRacesSection = ({ onAuthModal }: FeaturedRacesSectionProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [featuredRaces, setFeaturedRaces] = useState<FeaturedRace[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRace, setSelectedRace] = useState<FeaturedRace | null>(null);
  const [showRaceDetail, setShowRaceDetail] = useState(false);

  useEffect(() => {
    fetchFeaturedRaces();
  }, []);

  const fetchFeaturedRaces = async () => {
    try {
      setLoading(true);
      console.log('FeaturedRacesSection: Fetching latest 3 races for featured section');
      
      // Use the optimized method to get only 3 latest races with images included
      const data = await RaceService.fetchFeaturedRaces(3);
      console.log('FeaturedRacesSection: Raw featured race data received:', data.length, 'races');
      
      if (data.length === 0) {
        console.log('FeaturedRacesSection: No races found in database');
        setFeaturedRaces([]);
        return;
      }
      
      // Transform data to match FeaturedRace interface
      const transformedRaces: FeaturedRace[] = data.map(race => {
        console.log('FeaturedRacesSection: Processing race:', race.name, 'Images:', race.race_images?.length || 0);
        
        // Find main image: first by 'cover' category, then by lowest display_order
        const images = race.race_images || [];
        const coverImage = images.find(img => img.category === 'cover');
        const mainImage = coverImage || images.sort((a, b) => a.display_order - b.display_order)[0];
        
        const imageUrl = mainImage?.image_url || "/placeholder.svg";
        
        // Calculate days until race
        const raceDate = new Date(race.race_date);
        const today = new Date();
        const daysUntil = Math.ceil((raceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: race.id,
          name: race.name,
          location: race.start_location || race.property_info?.locality || "Ubicación no especificada",
          province: race.province,
          date: race.race_date,
          daysUntil: daysUntil,
          modalities: race.modalities || [],
          distances: race.distances || [],
          terrainProfile: race.terrain_profile || [],
          imageUrl: imageUrl,
          images: images,
          host: {
            id: race.host_id,
            name: race.host_info ? `${race.host_info.first_name || ''} ${race.host_info.last_name || ''}`.trim() : "Host Runner",
            rating: race.host_info?.average_rating || 4.5,
            verified: race.host_info?.verification_status === 'approved',
            imageUrl: race.host_info?.profile_image_url || "/placeholder.svg"
          },
          pointsCost: race.points_cost || 0,
          available: race.is_active,
          highlights: race.highlights || race.description || "Experiencia única de running",
          official_website: race.official_website,
          maxGuests: race.property_info?.max_guests || race.max_guests || 1,
          property_info: race.property_info
        };
      });
      
      console.log('FeaturedRacesSection: Transformed featured races:', transformedRaces.length, 'races');
      setFeaturedRaces(transformedRaces);
      
    } catch (error) {
      console.error('FeaturedRacesSection: Error fetching featured races:', error);
      toast.error('Error al cargar las carreras destacadas');
      setFeaturedRaces([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAllRaces = () => {
    console.log('FeaturedRacesSection: View all races button clicked');
    
    if (!user) {
      // Check if user is already logged in first
      toast.error("Para continuar explorando esta experiencia, necesitas registrarte.");
      onAuthModal("register");
      return;
    }
    
    // Navigate using React Router
    navigate('/discover');
  };

  const handleRaceClick = (race: FeaturedRace) => {
    if (!user) {
      toast.error("Para continuar explorando esta experiencia, necesitas registrarte.");
      onAuthModal("register");
      return;
    }
    
    console.log('FeaturedRacesSection: Race clicked, opening detail modal for:', race.name);
    setSelectedRace(race);
    setShowRaceDetail(true);
  };

  if (loading) {
    return (
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Carreras Destacadas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Descubre las carreras más populares en nuestra comunidad. Conecta con hosts locales 
              que conocen cada detalle de la carrera y la ciudad.
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E40AF]"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Carreras Destacadas
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Descubre las carreras más populares en nuestra comunidad. Conecta con hosts locales 
            que conocen cada detalle de la carrera y la ciudad.
          </p>
        </div>

        {featuredRaces.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No hay carreras disponibles en este momento</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredRaces.map((race) => (
                <FeaturedRaceCard
                  key={race.id}
                  race={race}
                  onViewDetails={() => handleRaceClick(race)}
                  onAuthModal={onAuthModal}
                />
              ))}
            </div>

            <div className="text-center">
              <Button 
                onClick={handleViewAllRaces}
                className="bg-runner-blue-600 hover:bg-runner-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg"
              >
                Ver Todas las Carreras
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Race Detail Modal */}
      {selectedRace && (
        <RaceDetailModal
          race={selectedRace}
          isOpen={showRaceDetail}
          onClose={() => {
            setShowRaceDetail(false);
            setSelectedRace(null);
          }}
        />
      )}
    </section>
  );
};

export default FeaturedRacesSection;
