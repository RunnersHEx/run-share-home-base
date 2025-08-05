import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Star, 
  Shield, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Trophy,
  Target,
  Activity,
  Clock
} from "lucide-react";
import { useState, useEffect } from "react";
import { ReviewsService } from "@/services/reviews/properReviewsService";
import { supabase } from "@/integrations/supabase/client";

interface GuestInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profile_image_url?: string;
  verification_status: string;
  average_rating?: number;
  bio?: string;
  location?: string;
  running_experience?: string;
  favorite_distances?: string[];
  personal_records?: any;
  created_at: string;
  points_balance: number;
}

interface GuestReview {
  id: string;
  rating: number;
  title?: string;
  content: string;
  created_at: string;
  review_type: 'host_to_guest' | 'guest_to_host';
  categories?: Record<string, number>;
  reviewer: {
    first_name: string;
    last_name: string;
    profile_image_url?: string;
  };
  booking: {
    race: {
      name: string;
      race_date: string;
    };
  };
}

interface GuestInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestId: string;
}

export const GuestInfoModal = ({ isOpen, onClose, guestId }: GuestInfoModalProps) => {
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [guestReviews, setGuestReviews] = useState<GuestReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewStats, setReviewStats] = useState({ totalReviews: 0, averageRating: 0 });

  useEffect(() => {
    if (isOpen && guestId) {
      fetchGuestInfo();
      fetchGuestReviews();
    }
  }, [isOpen, guestId]);

  const fetchGuestInfo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', guestId)
        .single();

      if (error) throw error;
      setGuestInfo(data);
    } catch (error) {
      console.error('Error fetching guest info:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuestReviews = async () => {
    try {
      // Get reviews where this user was reviewed (as reviewee)
      const result = await ReviewsService.getReviewsForHost(guestId);
      setGuestReviews(result.reviews);
      setReviewStats(result.stats);
    } catch (error) {
      console.error('Error fetching guest reviews:', error);
      setGuestReviews([]);
      setReviewStats({ totalReviews: 0, averageRating: 0 });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getDistanceLabel = (distance: string) => {
    const labels = {
      'ultra': 'Ultra',
      'marathon': 'Maratón', 
      'half_marathon': 'Media Maratón',
      '20k': '20K',
      '15k': '15K',
      '10k': '10K',
      '5k': '5K'
    };
    return labels[distance as keyof typeof labels] || distance;
  };

  if (loading && !guestInfo) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Información del Runner</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E40AF] mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando información del runner...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!guestInfo) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Información del Runner</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-600">No se pudo cargar la información del runner.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Información del Runner</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Guest Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={guestInfo.profile_image_url} />
                  <AvatarFallback className="text-lg">
                    {guestInfo.first_name?.[0]}{guestInfo.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-xl font-semibold">
                      {guestInfo.first_name} {guestInfo.last_name}
                    </h3>
                    {guestInfo.verification_status === 'approved' && (
                      <Badge className="bg-green-100 text-green-800">
                        <Shield className="w-3 h-3 mr-1" />
                        Verificado
                      </Badge>
                    )}
                  </div>
                  
                  {guestInfo.average_rating && guestInfo.average_rating > 0 ? (
                    <div className="flex items-center space-x-1 mb-2">
                      {renderStars(Math.round(guestInfo.average_rating))}
                      <span className="text-sm text-gray-600 ml-2">
                        {guestInfo.average_rating}/5 ({reviewStats.totalReviews} reseñas)
                      </span>
                    </div>
                  ) : reviewStats.totalReviews > 0 ? (
                    <div className="flex items-center space-x-1 mb-2">
                      {renderStars(Math.round(reviewStats.averageRating))}
                      <span className="text-sm text-gray-600 ml-2">
                        {reviewStats.averageRating.toFixed(1)}/5 ({reviewStats.totalReviews} reseñas)
                      </span>
                    </div>
                  ) : null}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Miembro desde {formatDate(guestInfo.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Trophy className="w-4 h-4" />
                      <span>{guestInfo.points_balance} puntos</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Información de Contacto</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{guestInfo.email}</span>
              </div>
              {guestInfo.phone && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{guestInfo.phone}</span>
                </div>
              )}
              {guestInfo.location && (
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{guestInfo.location}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Running Profile */}
          {(guestInfo.bio || guestInfo.running_experience || guestInfo.favorite_distances) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Perfil de Running</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {guestInfo.bio && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Biografía</h4>
                    <p className="text-sm text-gray-700">{guestInfo.bio}</p>
                  </div>
                )}
                
                {guestInfo.running_experience && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Experiencia</h4>
                    <p className="text-sm text-gray-700">{guestInfo.running_experience}</p>
                  </div>
                )}
                
                {guestInfo.favorite_distances && guestInfo.favorite_distances.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Distancias Favoritas</h4>
                    <div className="flex flex-wrap gap-2">
                      {guestInfo.favorite_distances.map((distance, index) => (
                        <Badge key={index} variant="outline">
                          {getDistanceLabel(distance)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-5 h-5" />
                <span>Reseñas ({reviewStats.totalReviews})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reviewStats.totalReviews === 0 ? (
                <p className="text-gray-600 text-center py-4">
                  Este runner aún no tiene reseñas.
                </p>
              ) : (
                <div className="space-y-4">
                  {guestReviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={review.reviewer.profile_image_url} />
                          <AvatarFallback className="text-xs">
                            {review.reviewer.first_name?.[0]}{review.reviewer.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <h5 className="font-medium text-sm">
                                {review.reviewer.first_name} {review.reviewer.last_name}
                              </h5>
                              <p className="text-xs text-gray-500">
                                {review.booking.race.name} - {formatDate(review.booking.race.race_date)}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-gray-500">
                                {formatDate(review.created_at)}
                              </span>
                              <Badge variant="outline" className="ml-2">
                                {review.review_type === 'host_to_guest' ? 'Host' : 'Guest'}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center mb-2">
                            {renderStars(review.rating)}
                            <span className="ml-2 text-sm text-gray-600">
                              {review.rating}/5
                            </span>
                          </div>
                          
                          {review.title && (
                            <h6 className="font-medium text-sm mb-1">{review.title}</h6>
                          )}
                          
                          <p className="text-sm text-gray-700">
                            {review.content}
                          </p>
                          
                          {review.categories && Object.keys(review.categories).length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-xs font-medium mb-1 text-gray-600">Valoraciones específicas:</p>
                              <div className="grid grid-cols-2 gap-1 text-xs">
                                {Object.entries(review.categories).map(([category, rating]) => (
                                  <div key={category} className="flex justify-between items-center">
                                    <span className="text-gray-600 capitalize">{category}:</span>
                                    <div className="flex">
                                      {Array.from({ length: 5 }, (_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-2 h-2 ${
                                            i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
