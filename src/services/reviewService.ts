import { supabase } from "@/integrations/supabase/client";

export interface Review {
  id?: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  title?: string;
  content: string;
  review_type: 'host_to_guest' | 'guest_to_host';
  categories?: Record<string, number>;
  is_public?: boolean;
  created_at?: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  hostReviews: number;
  guestReviews: number;
  responseRate: number;
}

export class ReviewService {
  static async createReview(reviewData: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    const { data, error } = await supabase
      .from('booking_reviews')
      .insert(reviewData)
      .select()
      .single();

    if (error) {
      console.error('Error creating review:', error);
      throw error;
    }

    return data as Review;
  }

  static async getReviewsForUser(userId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('booking_reviews')
      .select(`
        id,
        booking_id,
        reviewer_id,
        reviewee_id,
        rating,
        title,
        content,
        review_type,
        categories,
        is_public,
        created_at,
        reviewer:profiles!booking_reviews_reviewer_id_fkey(
          first_name,
          last_name,
          profile_image_url
        )
      `)
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }

    return (data || []) as Review[];
  }

  static async getReviewsByUser(userId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('booking_reviews')
      .select(`
        id,
        booking_id,
        reviewer_id,
        reviewee_id,
        rating,
        title,
        content,
        review_type,
        categories,
        is_public,
        created_at,
        reviewee:profiles!booking_reviews_reviewee_id_fkey(
          first_name,
          last_name,
          profile_image_url
        )
      `)
      .eq('reviewer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user reviews:', error);
      throw error;
    }

    return (data || []) as Review[];
  }

  static async getPendingReviews(userId: string): Promise<any[]> {
    // Get completed bookings where user participated
    const { data: completedBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        host:profiles!bookings_host_id_fkey(id, first_name, last_name, profile_image_url),
        guest:profiles!bookings_guest_id_fkey(id, first_name, last_name, profile_image_url),
        race:races(name, race_date)
      `)
      .eq('status', 'completed')
      .or(`host_id.eq.${userId},guest_id.eq.${userId}`);

    if (bookingsError) {
      console.error('Error fetching completed bookings:', bookingsError);
      throw bookingsError;
    }

    // Filter out bookings that already have reviews from this user
    const pendingReviews = [];
    for (const booking of completedBookings || []) {
      const { data: existingReview, error: reviewCheckError } = await supabase
        .from('booking_reviews')
        .select('id')
        .eq('booking_id', booking.id)
        .eq('reviewer_id', userId)
        .maybeSingle(); // Use maybeSingle to avoid errors when no row found

      if (!existingReview && !reviewCheckError) {
        pendingReviews.push(booking);
      }
    }

    return pendingReviews;
  }

  static async getReviewStats(userId: string): Promise<ReviewStats> {
    const [receivedReviews, givenReviews] = await Promise.all([
      this.getReviewsForUser(userId),
      this.getReviewsByUser(userId)
    ]);

    const totalReviews = receivedReviews.length;
    const averageRating = totalReviews > 0 
      ? receivedReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    const hostReviews = receivedReviews.filter(r => r.review_type === 'guest_to_host').length;
    const guestReviews = receivedReviews.filter(r => r.review_type === 'host_to_guest').length;

    // Calculate response rate based on pending vs completed reviews
    const pendingReviews = await this.getPendingReviews(userId);
    const totalEligibleReviews = givenReviews.length + pendingReviews.length;
    const responseRate = totalEligibleReviews > 0 
      ? (givenReviews.length / totalEligibleReviews) * 100 
      : 100;

    return {
      totalReviews,
      averageRating,
      hostReviews,
      guestReviews,
      responseRate
    };
  }

  static async hasUserReviewedBooking(userId: string, bookingId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('booking_reviews')
      .select('id')
      .eq('reviewer_id', userId)
      .eq('booking_id', bookingId)
      .maybeSingle(); // Use maybeSingle to avoid errors

    if (error) {
      console.error('Error checking existing review:', error);
      return false; // Return false on error rather than throwing
    }

    return !!data;
  }

  static async updateUserRatingStats(userId: string): Promise<void> {
    const stats = await this.getReviewStats(userId);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        average_rating: stats.averageRating
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user rating stats:', error);
      throw error;
    }
  }
}
