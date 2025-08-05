import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { ReviewsService, BookingReviewData, BookingReviewStats } from "@/services/reviews/properReviewsService";



interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  raceId?: string;
  propertyId?: string;
  hostId: string;
  hostName: string;
}

export const ReviewsModal = ({ isOpen, onClose, raceId, propertyId, hostId, hostName }: ReviewsModalProps) => {
  const [reviews, setReviews] = useState<BookingReviewData[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<BookingReviewStats>({ totalReviews: 0, averageRating: 0 });

  useEffect(() => {
    if (isOpen && (raceId || propertyId || hostId)) {
      fetchReviews();
    }
  }, [isOpen, raceId, propertyId, hostId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      let result;
      
      if (raceId) {
        result = await ReviewsService.getReviewsForRace(raceId);
      } else if (propertyId) {
        result = await ReviewsService.getReviewsForProperty(propertyId);
      } else {
        result = await ReviewsService.getReviewsForHost(hostId);
      }
      
      setReviews(result.reviews);
      setStats(result.stats);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
      setStats({ totalReviews: 0, averageRating: 0 });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderStars = (rating: number, size = "w-4 h-4") => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`${size} ${
          index < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reseñas de {hostName}</DialogTitle>
        </DialogHeader>
        
        {/* Stats Header */}
        {stats.totalReviews > 0 && (
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.averageRating.toFixed(1)}
                  </div>
                  <div className="flex justify-center mb-1">
                    {renderStars(Math.round(stats.averageRating))}
                  </div>
                  <div className="text-sm text-gray-600">Promedio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalReviews}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stats.totalReviews === 1 ? 'Reseña' : 'Reseñas'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E40AF] mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando reseñas...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Sin reseñas aún</h3>
              <p className="text-gray-600">Las reseñas aparecerán aquí después de las experiencias completadas.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {review.reviewer.profile_image_url ? (
                        <img
                          src={review.reviewer.profile_image_url}
                          alt={`${review.reviewer.first_name} ${review.reviewer.last_name}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">
                            {review.reviewer.first_name} {review.reviewer.last_name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {review.booking.race.name} - {formatDate(review.booking.race.race_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-gray-500">
                            {formatDate(review.created_at)}
                          </span>
                          <Badge variant="outline" className="ml-2">
                            {review.review_type === 'host_to_guest' ? 'Host' : 'Guest'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center mb-3">
                        {renderStars(review.rating)}
                        <span className="ml-2 text-sm text-gray-600">
                          {review.rating}/5
                        </span>
                      </div>
                      
                      {review.title && (
                        <h5 className="font-medium mb-2">{review.title}</h5>
                      )}
                      
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {review.content}
                      </p>
                      
                      {review.categories && Object.keys(review.categories).length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium mb-2 text-gray-600">Valoraciones específicas:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(review.categories).map(([category, rating]) => (
                              <div key={category} className="flex justify-between items-center">
                                <span className="text-gray-600 capitalize">{category}:</span>
                                <div className="flex">
                                  {renderStars(rating, "w-3 h-3")}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
