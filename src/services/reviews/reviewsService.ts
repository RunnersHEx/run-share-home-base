import { supabase } from "@/integrations/supabase/client";

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
}

export interface ReviewData {
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

export class ReviewsService {
  
  /**
   * Get reviews and stats for a specific race
   */
  static async getReviewsForRace(raceId: string): Promise<{ reviews: ReviewData[], stats: ReviewStats }> {
    try {
      // Get all bookings for this race
      const { data: raceBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('race_id', raceId);
      
      if (!raceBookings || raceBookings.length === 0) {
        return { reviews: [], stats: { totalReviews: 0, averageRating: 0 } };
      }

      const bookingIds = raceBookings.map(b => b.id);
      
      // Get reviews for these bookings
      const { data: reviews, error } = await supabase
        .from('booking_reviews')
        .select(`
          id,
          rating,
          title,
          content,
          created_at,
          review_type,
          categories,
          reviewer:profiles!booking_reviews_reviewer_id_fkey(
            first_name,
            last_name,
            profile_image_url
          ),
          booking:bookings!booking_reviews_booking_id_fkey(
            race:races(name, race_date)
          )
        `)
        .in('booking_id', bookingIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviewsData = reviews || [];
      const stats = this.calculateStats(reviewsData);
      
      return { reviews: reviewsData, stats };
    } catch (error) {
      console.error('Error fetching reviews for race:', error);
      return { reviews: [], stats: { totalReviews: 0, averageRating: 0 } };
    }
  }

  /**
   * Get reviews and stats for a specific property
   */
  static async getReviewsForProperty(propertyId: string): Promise<{ reviews: ReviewData[], stats: ReviewStats }> {
    try {
      // Get all bookings for this property
      const { data: propertyBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('property_id', propertyId);
      
      if (!propertyBookings || propertyBookings.length === 0) {
        return { reviews: [], stats: { totalReviews: 0, averageRating: 0 } };
      }

      const bookingIds = propertyBookings.map(b => b.id);
      
      // Get reviews for these bookings
      const { data: reviews, error } = await supabase
        .from('booking_reviews')
        .select(`
          id,
          rating,
          title,
          content,
          created_at,
          review_type,
          categories,
          reviewer:profiles!booking_reviews_reviewer_id_fkey(
            first_name,
            last_name,
            profile_image_url
          ),
          booking:bookings!booking_reviews_booking_id_fkey(
            race:races(name, race_date)
          )
        `)
        .in('booking_id', bookingIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviewsData = reviews || [];
      const stats = this.calculateStats(reviewsData);
      
      return { reviews: reviewsData, stats };
    } catch (error) {
      console.error('Error fetching reviews for property:', error);
      return { reviews: [], stats: { totalReviews: 0, averageRating: 0 } };
    }
  }

  /**
   * Get reviews and stats for a specific host/user
   */
  static async getReviewsForHost(hostId: string): Promise<{ reviews: ReviewData[], stats: ReviewStats }> {
    try {
      const { data: reviews, error } = await supabase
        .from('booking_reviews')
        .select(`
          id,
          rating,
          title,
          content,
          created_at,
          review_type,
          categories,
          reviewer:profiles!booking_reviews_reviewer_id_fkey(
            first_name,
            last_name,
            profile_image_url
          ),
          booking:bookings!booking_reviews_booking_id_fkey(
            race:races(name, race_date)
          )
        `)
        .eq('reviewee_id', hostId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviewsData = reviews || [];
      const stats = this.calculateStats(reviewsData);
      
      return { reviews: reviewsData, stats };
    } catch (error) {
      console.error('Error fetching reviews for host:', error);
      return { reviews: [], stats: { totalReviews: 0, averageRating: 0 } };
    }
  }

  /**
   * Get just the rating statistics (without full review data)
   */
  static async getRatingStatsForRace(raceId: string): Promise<ReviewStats> {
    try {
      // Get all bookings for this race
      const { data: raceBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('race_id', raceId);
      
      if (!raceBookings || raceBookings.length === 0) {
        return { totalReviews: 0, averageRating: 0 };
      }

      const bookingIds = raceBookings.map(b => b.id);
      
      // Get only ratings for efficiency
      const { data: reviews, error } = await supabase
        .from('booking_reviews')
        .select('rating')
        .in('booking_id', bookingIds);

      if (error) throw error;

      const reviewsData = reviews || [];
      return this.calculateStats(reviewsData);
    } catch (error) {
      console.error('Error fetching rating stats for race:', error);
      return { totalReviews: 0, averageRating: 0 };
    }
  }

  /**
   * Get just the rating statistics for a property
   */
  static async getRatingStatsForProperty(propertyId: string): Promise<ReviewStats> {
    try {
      // Get all bookings for this property
      const { data: propertyBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('property_id', propertyId);
      
      if (!propertyBookings || propertyBookings.length === 0) {
        return { totalReviews: 0, averageRating: 0 };
      }

      const bookingIds = propertyBookings.map(b => b.id);
      
      // Get only ratings for efficiency
      const { data: reviews, error } = await supabase
        .from('booking_reviews')
        .select('rating')
        .in('booking_id', bookingIds);

      if (error) throw error;

      const reviewsData = reviews || [];
      return this.calculateStats(reviewsData);
    } catch (error) {
      console.error('Error fetching rating stats for property:', error);
      return { totalReviews: 0, averageRating: 0 };
    }
  }

  /**
   * Get just the rating statistics for a host
   */
  static async getRatingStatsForHost(hostId: string): Promise<ReviewStats> {
    try {
      const { data: reviews, error } = await supabase
        .from('booking_reviews')
        .select('rating')
        .eq('reviewee_id', hostId);

      if (error) throw error;

      const reviewsData = reviews || [];
      return this.calculateStats(reviewsData);
    } catch (error) {
      console.error('Error fetching rating stats for host:', error);
      return { totalReviews: 0, averageRating: 0 };
    }
  }

  /**
   * Calculate statistics from review data
   */
  private static calculateStats(reviews: any[]): ReviewStats {
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;
    
    return { totalReviews, averageRating };
  }
}
