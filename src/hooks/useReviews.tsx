
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ReviewService, Review, ReviewStats } from "@/services/reviewService";
import { toast } from "sonner";

export const useReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [givenReviews, setGivenReviews] = useState<Review[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    hostReviews: 0,
    guestReviews: 0,
    responseRate: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [receivedReviews, userGivenReviews, pending, userStats] = await Promise.all([
        ReviewService.getReviewsForUser(user.id),
        ReviewService.getReviewsByUser(user.id),
        ReviewService.getPendingReviews(user.id),
        ReviewService.getReviewStats(user.id)
      ]);

      setReviews(receivedReviews);
      setGivenReviews(userGivenReviews);
      setPendingReviews(pending);
      setStats(userStats);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Error al cargar las valoraciones');
    } finally {
      setLoading(false);
    }
  };

  const createReview = async (reviewData: Omit<Review, 'id' | 'created_at'>) => {
    try {
      const newReview = await ReviewService.createReview(reviewData);
      
      // Update user rating stats
      await ReviewService.updateUserRatingStats(reviewData.reviewee_id);
      
      toast.success('Valoración enviada correctamente');
      
      // Refresh data
      await fetchReviews();
      
      return newReview;
    } catch (error) {
      console.error('Error creating review:', error);
      toast.error('Error al enviar la valoración');
      throw error;
    }
  };

  const hasReviewedBooking = async (bookingId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      return await ReviewService.hasUserReviewedBooking(user.id, bookingId);
    } catch (error) {
      console.error('Error checking review status:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [user]);

  return {
    reviews,
    givenReviews,
    pendingReviews,
    stats,
    loading,
    createReview,
    hasReviewedBooking,
    refetchReviews: fetchReviews
  };
};
