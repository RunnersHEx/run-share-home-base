import { PointsManagementService } from '@/services/pointsManagementService';
import { PointsCalculationService } from '@/services/pointsCalculationService';

/**
 * Utility functions for integrating the points system throughout the application
 */
export class PointsIntegrationUtils {

  /**
   * Handle property creation points award
   * Should be called after a property is successfully created
   */
  static async handlePropertyCreated(userId: string, propertyTitle: string): Promise<void> {
    try {
      await PointsManagementService.awardPropertyPoints(userId, propertyTitle);
      console.log(`Awarded 30 points to ${userId} for creating property: ${propertyTitle}`);
    } catch (error) {
      console.error('Error awarding property creation points:', error);
      // Don't throw error to avoid failing the property creation
    }
  }

  /**
   * Handle race creation points award
   * Should be called after a race is successfully created
   */
  static async handleRaceCreated(userId: string, raceName: string): Promise<void> {
    try {
      await PointsManagementService.awardRacePoints(userId, raceName);
      console.log(`Awarded 40 points to ${userId} for creating race: ${raceName}`);
    } catch (error) {
      console.error('Error awarding race creation points:', error);
      // Don't throw error to avoid failing the race creation
    }
  }

  /**
   * Handle identity verification completion
   * Should be called when verification is approved
   */
  static async handleVerificationCompleted(userId: string): Promise<void> {
    try {
      await PointsManagementService.awardVerificationPoints(userId);
      console.log(`Awarded 25 points to ${userId} for identity verification`);
    } catch (error) {
      console.error('Error awarding verification points:', error);
    }
  }

  /**
   * Handle new subscription
   * Should be called when a user subscribes for the first time
   */
  static async handleNewSubscription(userId: string): Promise<void> {
    try {
      await PointsManagementService.awardNewSubscriberPoints(userId);
      console.log(`Awarded 30 points to ${userId} for new subscription`);
    } catch (error) {
      console.error('Error awarding new subscription points:', error);
    }
  }

  /**
   * Handle subscription renewal
   * Should be called when a user renews their subscription
   */
  static async handleSubscriptionRenewal(userId: string): Promise<void> {
    try {
      await PointsManagementService.awardRenewalPoints(userId);
      console.log(`Awarded 50 points to ${userId} for subscription renewal`);
    } catch (error) {
      console.error('Error awarding renewal points:', error);
    }
  }

  /**
   * Handle 5-star review received
   * Should be called when a user receives a 5-star review
   */
  static async handleFiveStarReview(userId: string, bookingId: string): Promise<void> {
    try {
      await PointsManagementService.awardReviewPoints(userId, bookingId);
      console.log(`Awarded 15 points to ${userId} for 5-star review`);
    } catch (error) {
      console.error('Error awarding review points:', error);
    }
  }

  /**
   * Handle booking completion (hosting)
   * Should be called when a booking is marked as completed
   */
  static async handleBookingCompleted(bookingId: string, hostId: string, checkInDate: string, checkOutDate: string): Promise<void> {
    try {
      await PointsManagementService.awardHostingPoints(bookingId, hostId, checkInDate, checkOutDate);
      console.log(`Awarded hosting points to ${hostId} for completed booking ${bookingId}`);
    } catch (error) {
      console.error('Error awarding hosting points:', error);
    }
  }

  /**
   * Check if user can afford a booking
   * Returns both availability and cost information
   */
  static async checkBookingAffordability(
    userId: string, 
    raceId: string, 
    checkInDate: string, 
    checkOutDate: string
  ): Promise<{
    canAfford: boolean;
    cost: number;
    currentBalance: number;
    shortfall?: number;
  }> {
    try {
      const cost = await PointsCalculationService.calculateProvincialBookingCost({
        raceId,
        checkInDate,
        checkOutDate
      });

      const currentBalance = await PointsCalculationService.getUserPointsBalance(userId);
      const canAfford = currentBalance >= cost;
      const shortfall = canAfford ? undefined : cost - currentBalance;

      return {
        canAfford,
        cost,
        currentBalance,
        shortfall
      };
    } catch (error) {
      console.error('Error checking booking affordability:', error);
      return {
        canAfford: false,
        cost: 0,
        currentBalance: 0,
        shortfall: 0
      };
    }
  }

  /**
   * Get provincial rate for a given province
   */
  static getProvincialRate(province: string): number {
    return PointsCalculationService.getProvincialPointsPerNight(province);
  }

  /**
   * Calculate nights between two dates
   */
  static calculateNights(checkInDate: string, checkOutDate: string): number {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  /**
   * Get user's points summary with formatted data
   */
  static async getUserPointsSummaryFormatted(userId: string): Promise<{
    balance: number;
    totalEarned: number;
    totalSpent: number;
    totalPenalties: number;
    formattedBalance: string;
    formattedEarned: string;
    formattedSpent: string;
    formattedPenalties: string;
  }> {
    try {
      const summary = await PointsManagementService.getUserPointsSummary(userId);
      
      return {
        balance: summary.current_balance,
        totalEarned: summary.total_earned,
        totalSpent: summary.total_spent,
        totalPenalties: summary.total_penalties,
        formattedBalance: summary.current_balance.toLocaleString(),
        formattedEarned: summary.total_earned.toLocaleString(),
        formattedSpent: summary.total_spent.toLocaleString(),
        formattedPenalties: summary.total_penalties.toLocaleString()
      };
    } catch (error) {
      console.error('Error getting formatted points summary:', error);
      return {
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        totalPenalties: 0,
        formattedBalance: '0',
        formattedEarned: '0',
        formattedSpent: '0',
        formattedPenalties: '0'
      };
    }
  }

  /**
   * Format points for display
   */
  static formatPoints(points: number): string {
    return points.toLocaleString();
  }

  /**
   * Get points color based on amount (for UI styling)
   */
  static getPointsColor(amount: number): string {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  }

  /**
   * Get transaction type display name
   */
  static getTransactionTypeDisplayName(type: string): string {
    const typeMap: Record<string, string> = {
      'booking_payment': 'Booking Payment',
      'booking_earning': 'Hosting Earnings',
      'booking_refund': 'Refund/Penalty',
      'subscription_bonus': 'Bonus Points'
    };
    
    return typeMap[type] || type;
  }

  /**
   * Get transaction type icon
   */
  static getTransactionTypeIcon(type: string): string {
    const iconMap: Record<string, string> = {
      'booking_payment': '💳',
      'booking_earning': '🏠',
      'booking_refund': '↩️',
      'subscription_bonus': '🎁'
    };
    
    return iconMap[type] || '💰';
  }

  /**
   * Validate if dates are valid for booking
   */
  static validateBookingDates(checkInDate: string, checkOutDate: string): {
    isValid: boolean;
    error?: string;
  } {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      return {
        isValid: false,
        error: 'Check-in date cannot be in the past'
      };
    }

    if (checkOut <= checkIn) {
      return {
        isValid: false,
        error: 'Check-out date must be after check-in date'
      };
    }

    const nights = this.calculateNights(checkInDate, checkOutDate);
    if (nights > 30) {
      return {
        isValid: false,
        error: 'Booking cannot exceed 30 nights'
      };
    }

    return { isValid: true };
  }

  /**
   * Get points earning opportunities for user education
   */
  static getPointsEarningOpportunities(): Array<{
    action: string;
    points: number;
    description: string;
    frequency: 'once' | 'per_action' | 'yearly';
  }> {
    return [
      {
        action: 'Add Property',
        points: 30,
        description: 'Add a new property to the platform',
        frequency: 'per_action'
      },
      {
        action: 'Add Race',
        points: 40,
        description: 'Create a new race event',
        frequency: 'per_action'
      },
      {
        action: 'Complete Hosting',
        points: 40,
        description: 'Per night of successful hosting',
        frequency: 'per_action'
      },
      {
        action: '5-Star Review',
        points: 15,
        description: 'Receive a 5-star review',
        frequency: 'per_action'
      },
      {
        action: 'Identity Verification',
        points: 25,
        description: 'Complete identity verification',
        frequency: 'once'
      },
      {
        action: 'New Subscription',
        points: 30,
        description: 'Subscribe for the first time',
        frequency: 'once'
      },
      {
        action: 'Subscription Renewal',
        points: 50,
        description: 'Renew your annual subscription',
        frequency: 'yearly'
      }
    ];
  }

  /**
   * Get provincial points mapping for display
   */
  static getProvincialPointsForDisplay(): Array<{
    province: string;
    pointsPerNight: number;
    tier: 'low' | 'medium' | 'high' | 'premium';
  }> {
    const allProvinces = PointsCalculationService.getAllProvincialPoints();
    
    return Object.entries(allProvinces).map(([province, points]) => ({
      province,
      pointsPerNight: points,
      tier: points <= 20 ? 'low' : points <= 30 ? 'medium' : points <= 40 ? 'high' : 'premium'
    })).sort((a, b) => a.province.localeCompare(b.province));
  }

  /**
   * Get tier color for provincial points display
   */
  static getTierColor(tier: 'low' | 'medium' | 'high' | 'premium'): string {
    const colorMap = {
      'low': 'text-green-600 bg-green-50',
      'medium': 'text-blue-600 bg-blue-50',
      'high': 'text-orange-600 bg-orange-50',
      'premium': 'text-red-600 bg-red-50'
    };
    
    return colorMap[tier];
  }
}
