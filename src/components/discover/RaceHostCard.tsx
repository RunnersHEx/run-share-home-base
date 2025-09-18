
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Star } from "lucide-react";
import { ReviewsModal } from "./ReviewsModal";
import { ProfilePhotoModal } from "@/components/common/ProfilePhotoModal";
import { useState, useEffect } from "react";
import { ReviewsService, BookingReviewsService } from "@/services/reviews/properReviewsService";

interface RaceHostCardProps {
  host: {
    id: string;
    name: string;
    rating: number;
    verified: boolean;
    imageUrl: string;
  };
  raceId?: string;
  propertyId?: string;
}

export const RaceHostCard = ({ host, raceId, propertyId }: RaceHostCardProps) => {
  const [showReviews, setShowReviews] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [dynamicRating, setDynamicRating] = useState(host.rating);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHostRating();
  }, [host.id, raceId, propertyId]);

  const fetchHostRating = async () => {
    try {
      let stats;
      
      if (raceId) {
        stats = await ReviewsService.getRatingStatsForRace(raceId);
      } else if (propertyId) {
        stats = await ReviewsService.getRatingStatsForProperty(propertyId);
      } else {
        stats = await ReviewsService.getRatingStatsForHost(host.id);
      }

      setDynamicRating(stats.averageRating);
      setReviewCount(stats.totalReviews);
    } catch (error) {
      console.error('Error fetching host rating:', error);
      // Fallback to original rating
      setDynamicRating(host.rating);
      setReviewCount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tu Host Runner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <img 
              src={host.imageUrl} 
              alt={host.name}
              className="w-12 h-12 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all duration-200"
              onClick={() => setShowPhotoModal(true)}
              title="Hacer clic para ver la foto en tamaño completo"
            />
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-medium">{host.name}</span>
                {host.verified && (
                  <CheckCircle className="w-4 h-4 ml-1 text-green-600" />
                )}
              </div>
              <Button
                variant="ghost"
                className="h-auto p-0 justify-start hover:bg-transparent"
                onClick={() => setShowReviews(true)}
              >
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm ml-1 text-gray-500 hover:text-blue-600 hover:underline">
                    {loading ? (
                      <span className="animate-pulse">Cargando...</span>
                    ) : reviewCount > 0 ? (
                      `${dynamicRating.toFixed(1)} ⭐ ${reviewCount} ${reviewCount === 1 ? 'reseña' : 'reseñas'}`
                    ) : (
                      'Sin reseñas aún'
                    )}
                  </span>
                </div>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ReviewsModal
        isOpen={showReviews}
        onClose={() => setShowReviews(false)}
        raceId={raceId}
        propertyId={propertyId}
        hostId={host.id}
        hostName={host.name}
      />

      <ProfilePhotoModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        imageUrl={host.imageUrl}
        userName={host.name}
      />
    </>
  );
};
