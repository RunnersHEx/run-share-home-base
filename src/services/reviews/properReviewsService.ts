import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// BOOKING REVIEWS (for race/property experiences)
// ============================================================================

export interface BookingReviewData {
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

export interface BookingReviewStats {
  totalReviews: number;
  averageRating: number;
}

// ============================================================================
// HOUSE SWAP REVIEWS (for house swapping experiences)
// ============================================================================

export interface HouseReviewData {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  reviewer: {
    first_name: string;
    last_name: string;
    profile_image_url?: string;
  };
  house: {
    title: string;
    city: string;
    country: string;
  };
  swap_request: {
    check_in_date: string;
    check_out_date: string;
  };
}

export interface HouseReviewStats {
  totalReviews: number;
  averageRating: number;
}

// ============================================================================
// BOOKING REVIEWS SERVICE
// ============================================================================

class BookingReviewsService {
  
  /**
   * Get booking reviews for a specific race
   */
  static async getReviewsForRace(raceId: string): Promise<{ reviews: BookingReviewData[], stats: BookingReviewStats }> {
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
      console.error('Error fetching booking reviews for race:', error);
      return { reviews: [], stats: { totalReviews: 0, averageRating: 0 } };
    }
  }

  /**
   * Get booking reviews for a specific property
   */
  static async getReviewsForProperty(propertyId: string): Promise<{ reviews: BookingReviewData[], stats: BookingReviewStats }> {
    try {
      const { data: propertyBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('property_id', propertyId);
      
      if (!propertyBookings || propertyBookings.length === 0) {
        return { reviews: [], stats: { totalReviews: 0, averageRating: 0 } };
      }

      const bookingIds = propertyBookings.map(b => b.id);
      
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
      console.error('Error fetching booking reviews for property:', error);
      return { reviews: [], stats: { totalReviews: 0, averageRating: 0 } };
    }
  }

  /**
   * Get booking reviews for a specific host/user
   */
  static async getReviewsForHost(hostId: string): Promise<{ reviews: BookingReviewData[], stats: BookingReviewStats }> {
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
      console.error('Error fetching booking reviews for host:', error);
      return { reviews: [], stats: { totalReviews: 0, averageRating: 0 } };
    }
  }

  /**
   * Get rating statistics for race (lightweight)
   */
  static async getRatingStatsForRace(raceId: string): Promise<BookingReviewStats> {
    try {
      const { data: raceBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('race_id', raceId);
      
      if (!raceBookings || raceBookings.length === 0) {
        return { totalReviews: 0, averageRating: 0 };
      }

      const bookingIds = raceBookings.map(b => b.id);
      
      const { data: reviews, error } = await supabase
        .from('booking_reviews')
        .select('rating')
        .in('booking_id', bookingIds);

      if (error) throw error;

      const reviewsData = reviews || [];
      return this.calculateStats(reviewsData);
    } catch (error) {
      console.error('Error fetching booking rating stats for race:', error);
      return { totalReviews: 0, averageRating: 0 };
    }
  }

  /**
   * Get rating statistics for property (lightweight)
   */
  static async getRatingStatsForProperty(propertyId: string): Promise<BookingReviewStats> {
    try {
      const { data: propertyBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('property_id', propertyId);
      
      if (!propertyBookings || propertyBookings.length === 0) {
        return { totalReviews: 0, averageRating: 0 };
      }

      const bookingIds = propertyBookings.map(b => b.id);
      
      const { data: reviews, error } = await supabase
        .from('booking_reviews')
        .select('rating')
        .in('booking_id', bookingIds);

      if (error) throw error;

      const reviewsData = reviews || [];
      return this.calculateStats(reviewsData);
    } catch (error) {
      console.error('Error fetching booking rating stats for property:', error);
      return { totalReviews: 0, averageRating: 0 };
    }
  }

  /**
   * Get rating statistics for host (lightweight)
   */
  static async getRatingStatsForHost(hostId: string): Promise<BookingReviewStats> {
    try {
      const { data: reviews, error } = await supabase
        .from('booking_reviews')
        .select('rating')
        .eq('reviewee_id', hostId);

      if (error) throw error;

      const reviewsData = reviews || [];
      return this.calculateStats(reviewsData);
    } catch (error) {
      console.error('Error fetching booking rating stats for host:', error);
      return { totalReviews: 0, averageRating: 0 };
    }
  }

  /**
   * Create a new booking review
   */
  static async createBookingReview(reviewData: {
    booking_id: string;
    reviewer_id: string;
    reviewee_id: string;
    rating: number;
    title?: string;
    content: string;
    review_type: 'host_to_guest' | 'guest_to_host';
    categories?: Record<string, number>;
  }) {
    try {
      const { data, error } = await supabase
        .from('booking_reviews')
        .insert(reviewData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating booking review:', error);
      throw error;
    }
  }

  /**
   * Calculate statistics from review data
   */
  private static calculateStats(reviews: any[]): BookingReviewStats {
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;
    
    return { totalReviews, averageRating };
  }
}

// ============================================================================
// HOUSE SWAP REVIEWS SERVICE
// ============================================================================

class HouseReviewsService {
  
  /**
   * Get house reviews for a specific house
   */
  static async getReviewsForHouse(houseId: string): Promise<{ reviews: HouseReviewData[], stats: HouseReviewStats }> {
    try {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          reviewer:profiles!reviews_reviewer_id_profiles_fkey(
            first_name,
            last_name,
            profile_image_url
          ),
          house:houses!reviews_reviewed_house_id_fkey(
            title,
            city,
            country
          ),
          swap_request:swap_requests!reviews_swap_request_id_fkey(
            check_in_date,
            check_out_date
          )
        `)
        .eq('reviewed_house_id', houseId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviewsData = reviews || [];
      const stats = this.calculateStats(reviewsData);
      
      return { reviews: reviewsData, stats };
    } catch (error) {
      console.error('Error fetching house reviews:', error);
      return { reviews: [], stats: { totalReviews: 0, averageRating: 0 } };
    }
  }

  /**
   * Get house reviews written by a specific reviewer
   */
  static async getReviewsByReviewer(reviewerId: string): Promise<{ reviews: HouseReviewData[], stats: HouseReviewStats }> {
    try {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          reviewer:profiles!reviews_reviewer_id_profiles_fkey(
            first_name,
            last_name,
            profile_image_url
          ),
          house:houses!reviews_reviewed_house_id_fkey(
            title,
            city,
            country
          ),
          swap_request:swap_requests!reviews_swap_request_id_fkey(
            check_in_date,
            check_out_date
          )
        `)
        .eq('reviewer_id', reviewerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviewsData = reviews || [];
      const stats = this.calculateStats(reviewsData);
      
      return { reviews: reviewsData, stats };
    } catch (error) {
      console.error('Error fetching house reviews by reviewer:', error);
      return { reviews: [], stats: { totalReviews: 0, averageRating: 0 } };
    }
  }

  /**
   * Get rating statistics for a house (lightweight)
   */
  static async getRatingStatsForHouse(houseId: string): Promise<HouseReviewStats> {
    try {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_house_id', houseId);

      if (error) throw error;

      const reviewsData = reviews || [];
      return this.calculateStats(reviewsData);
    } catch (error) {
      console.error('Error fetching house rating stats:', error);
      return { totalReviews: 0, averageRating: 0 };
    }
  }

  /**
   * Create a new house review
   */
  static async createHouseReview(reviewData: {
    reviewer_id: string;
    reviewed_house_id: string;
    swap_request_id: string;
    rating: number;
    comment?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating house review:', error);
      throw error;
    }
  }

  /**
   * Calculate statistics from review data
   */
  private static calculateStats(reviews: any[]): HouseReviewStats {
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;
    
    return { totalReviews, averageRating };
  }
}

// ============================================================================
// UNIFIED REVIEWS SERVICE (for backward compatibility)
// ============================================================================

class ReviewsService {
  // Booking Reviews (current implementation)
  static async getReviewsForRace(raceId: string) {
    return BookingReviewsService.getReviewsForRace(raceId);
  }
  
  static async getReviewsForProperty(propertyId: string) {
    return BookingReviewsService.getReviewsForProperty(propertyId);
  }
  
  static async getReviewsForHost(hostId: string) {
    return BookingReviewsService.getReviewsForHost(hostId);
  }
  
  static async getRatingStatsForRace(raceId: string) {
    return BookingReviewsService.getRatingStatsForRace(raceId);
  }
  
  static async getRatingStatsForProperty(propertyId: string) {
    return BookingReviewsService.getRatingStatsForProperty(propertyId);
  }
  
  static async getRatingStatsForHost(hostId: string) {
    return BookingReviewsService.getRatingStatsForHost(hostId);
  }
  
  static async createBookingReview(reviewData: any) {
    return BookingReviewsService.createBookingReview(reviewData);
  }

  // House Reviews (for future house swapping features)
  static async getReviewsForHouse(houseId: string) {
    return HouseReviewsService.getReviewsForHouse(houseId);
  }
  
  static async getReviewsByReviewer(reviewerId: string) {
    return HouseReviewsService.getReviewsByReviewer(reviewerId);
  }
  
  static async getRatingStatsForHouse(houseId: string) {
    return HouseReviewsService.getRatingStatsForHouse(houseId);
  }
  
  static async createHouseReview(reviewData: any) {
    return HouseReviewsService.createHouseReview(reviewData);
  }
}

// Export individual services for specific use cases
export { BookingReviewsService, HouseReviewsService, ReviewsService };

// Export types
export type { 
  BookingReviewData, 
  BookingReviewStats,
  HouseReviewData,
  HouseReviewStats 
};
