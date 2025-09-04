import { supabase } from '@/integrations/supabase/client';
import { PointsCalculationService } from './pointsCalculationService';

export interface PointsTransaction {
  id: string;
  user_id: string;
  booking_id?: string;
  amount: number;
  type: 'booking_payment' | 'booking_earning' | 'booking_refund' | 'subscription_bonus';
  description: string;
  created_at: string;
}

export interface PointsBalance {
  current_balance: number;
  total_earned: number;
  total_spent: number;
  total_penalties: number;
}

/**
 * Comprehensive Points Management Service
 * Handles all point transactions according to the requirements document
 */
export class PointsManagementService {
  
  /**
   * Award points for hosting completion (40 points per night)
   * This is called automatically by database triggers, but can be called manually if needed
   */
  static async awardHostingPoints(bookingId: string, hostId: string, checkInDate: string, checkOutDate: string): Promise<void> {
    try {
      const nights = this.calculateNights(checkInDate, checkOutDate);
      const totalPoints = nights * 40;

      await this.addPointsTransaction({
        userId: hostId,
        amount: totalPoints,
        type: 'booking_earning',
        description: `Hosting reward: ${nights} nights × 40 points`,
        bookingId
      });

      console.log(`Awarded ${totalPoints} hosting points to user ${hostId}`);
    } catch (error) {
      console.error('Error awarding hosting points:', error);
      throw error;
    }
  }

  /**
   * Award points for adding a property (30 points)
   */
  static async awardPropertyPoints(userId: string, propertyTitle: string): Promise<void> {
    try {
      await this.addPointsTransaction({
        userId,
        amount: 30,
        type: 'subscription_bonus',
        description: `Added new property: ${propertyTitle}`
      });

      console.log(`Awarded 30 property points to user ${userId}`);
    } catch (error) {
      console.error('Error awarding property points:', error);
      throw error;
    }
  }

  /**
   * Award points for adding a race (40 points)
   */
  static async awardRacePoints(userId: string, raceName: string): Promise<void> {
    try {
      await this.addPointsTransaction({
        userId,
        amount: 40,
        type: 'subscription_bonus',
        description: `Added new race: ${raceName}`
      });

      console.log(`Awarded 40 race points to user ${userId}`);
    } catch (error) {
      console.error('Error awarding race points:', error);
      throw error;
    }
  }

  /**
   * Award points for 5-star reviews (15 points)
   */
  static async awardReviewPoints(userId: string, bookingId: string): Promise<void> {
    try {
      await this.addPointsTransaction({
        userId,
        amount: 15,
        type: 'subscription_bonus',
        description: 'Received 5-star review',
        bookingId
      });

      console.log(`Awarded 15 review points to user ${userId}`);
    } catch (error) {
      console.error('Error awarding review points:', error);
      throw error;
    }
  }

  /**
   * Award points for identity verification (25 points)
   */
  static async awardVerificationPoints(userId: string): Promise<void> {
    try {
      await this.addPointsTransaction({
        userId,
        amount: 25,
        type: 'subscription_bonus',
        description: 'Identity verification completed'
      });

      console.log(`Awarded 25 verification points to user ${userId}`);
    } catch (error) {
      console.error('Error awarding verification points:', error);
      throw error;
    }
  }

  /**
   * Award points for new subscription (30 points)
   */
  static async awardNewSubscriberPoints(userId: string): Promise<void> {
    try {
      await this.addPointsTransaction({
        userId,
        amount: 30,
        type: 'subscription_bonus',
        description: 'New subscriber bonus'
      });

      console.log(`Awarded 30 new subscriber points to user ${userId}`);
    } catch (error) {
      console.error('Error awarding new subscriber points:', error);
      throw error;
    }
  }

  /**
   * Award points for subscription renewal (50 points)
   */
  static async awardRenewalPoints(userId: string): Promise<void> {
    try {
      await this.addPointsTransaction({
        userId,
        amount: 50,
        type: 'subscription_bonus',
        description: 'Annual subscription renewal'
      });

      console.log(`Awarded 50 renewal points to user ${userId}`);
    } catch (error) {
      console.error('Error awarding renewal points:', error);
      throw error;
    }
  }

  /**
   * Process booking payment using provincial points system
   */
  static async processBookingPayment(bookingData: {
    bookingId: string;
    guestId: string;
    hostId: string;
    raceId: string;
    checkInDate: string;
    checkOutDate: string;
  }): Promise<number> {
    try {
      console.log('Processing booking payment:', bookingData);

      // Use the database function to process the booking payment
      // This function handles all the logic including cost calculation, balance checks, and transaction recording
      const { data, error } = await supabase.rpc('process_booking_with_provincial_points', {
        p_booking_id: bookingData.bookingId,
        p_guest_id: bookingData.guestId,
        p_host_id: bookingData.hostId,
        p_race_id: bookingData.raceId,
        p_check_in_date: bookingData.checkInDate,
        p_check_out_date: bookingData.checkOutDate
      });

      if (error) {
        console.error('Error processing booking payment:', error);
        throw error;
      }

      const cost = data as number;
      console.log(`Booking payment processed: ${cost} points`);
      return cost;
    } catch (error) {
      console.error('Error processing booking payment:', error);
      throw error;
    }
  }

  /**
   * Process booking refund (for cancellations)
   */
  static async processBookingRefund(bookingId: string, guestId: string, hostId: string, refundAmount: number): Promise<void> {
    try {
      // Refund points to guest
      await this.addPointsTransaction({
        userId: guestId,
        amount: refundAmount,
        type: 'booking_refund',
        description: 'Refund for cancelled booking',
        bookingId
      });

      // Deduct points from host
      await this.addPointsTransaction({
        userId: hostId,
        amount: -refundAmount,
        type: 'booking_refund',
        description: 'Refund deduction',
        bookingId
      });

      console.log(`Booking refund processed: ${refundAmount} points`);
    } catch (error) {
      console.error('Error processing booking refund:', error);
      throw error;
    }
  }

  /**
   * Apply host cancellation penalty
   */
  static async applyHostCancellationPenalty(bookingId: string, hostId: string, guestId: string, originalCost: number): Promise<void> {
    try {
      // Penalty is the same as what guest paid, or 100 points if not available
      const penaltyAmount = originalCost || 100;

      // Apply penalty to host
      await this.addPointsTransaction({
        userId: hostId,
        amount: -penaltyAmount,
        type: 'booking_refund',
        description: `Host cancellation penalty: ${penaltyAmount} points`,
        bookingId
      });

      // Refund guest
      await this.addPointsTransaction({
        userId: guestId,
        amount: originalCost,
        type: 'booking_refund',
        description: 'Refund for host cancellation',
        bookingId
      });

      console.log(`Host cancellation penalty applied: ${penaltyAmount} points`);
    } catch (error) {
      console.error('Error applying host cancellation penalty:', error);
      throw error;
    }
  }

  /**
   * Get user's complete points summary
   */
  static async getUserPointsSummary(userId: string): Promise<PointsBalance> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('points_balance')
        .eq('id', userId)
        .single();

      const { data: transactions } = await supabase
        .from('points_transactions')
        .select('amount, type')
        .eq('user_id', userId);

      let totalEarned = 0;
      let totalSpent = 0;
      let totalPenalties = 0;

      transactions?.forEach(transaction => {
        if (transaction.amount > 0) {
          totalEarned += transaction.amount;
        } else {
          if (transaction.type === 'booking_refund' && transaction.amount < 0) {
            totalPenalties += Math.abs(transaction.amount);
          } else {
            totalSpent += Math.abs(transaction.amount);
          }
        }
      });

      return {
        current_balance: profile?.points_balance || 0,
        total_earned: totalEarned,
        total_spent: totalSpent,
        total_penalties: totalPenalties
      };
    } catch (error) {
      console.error('Error getting user points summary:', error);
      throw error;
    }
  }

  /**
   * Get user's recent points transactions
   */
  static async getUserPointsHistory(userId: string, limit: number = 50): Promise<PointsTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching points history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting points history:', error);
      return [];
    }
  }

  /**
   * Internal method to add a points transaction
   */
  private static async addPointsTransaction(params: {
    userId: string;
    amount: number;
    type: 'booking_payment' | 'booking_earning' | 'booking_refund' | 'subscription_bonus';
    description: string;
    bookingId?: string;
  }): Promise<void> {
    try {
      // Get current balance first
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('points_balance')
        .eq('id', params.userId)
        .single();

      if (fetchError) {
        console.error('Error fetching current balance:', fetchError);
        throw fetchError;
      }

      const currentBalance = profile?.points_balance || 0;
      const newBalance = currentBalance + params.amount;

      // Check for negative balance
      if (newBalance < 0) {
        throw new Error(`Insufficient points. Current: ${currentBalance}, Required: ${Math.abs(params.amount)}`);
      }

      // Update user's points balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          points_balance: newBalance
        })
        .eq('id', params.userId);

      if (updateError) {
        console.error('Error updating points balance:', updateError);
        throw updateError;
      }

      // Record the transaction
      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: params.userId,
          amount: params.amount,
          type: params.type,
          description: params.description,
          booking_id: params.bookingId || null
        });

      if (transactionError) {
        console.error('Error recording points transaction:', transactionError);
        throw transactionError;
      }
    } catch (error) {
      console.error('Error adding points transaction:', error);
      throw error;
    }
  }

  /**
   * Calculate number of nights between dates
   */
  private static calculateNights(checkInDate: string, checkOutDate: string): number {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  /**
   * Validate if user has sufficient points for a transaction
   */
  static async validateSufficientPoints(userId: string, requiredPoints: number): Promise<boolean> {
    try {
      const balance = await PointsCalculationService.getUserPointsBalance(userId);
      return balance >= requiredPoints;
    } catch (error) {
      console.error('Error validating sufficient points:', error);
      return false;
    }
  }

  /**
   * Get points statistics for admin dashboard
   */
  static async getPointsStatistics(): Promise<{
    totalPointsInCirculation: number;
    totalTransactions: number;
    averageUserBalance: number;
    topEarners: Array<{ userId: string; totalEarned: number; }>;
  }> {
    try {
      // Get total points in circulation
      const { data: totalBalanceData } = await supabase
        .from('profiles')
        .select('points_balance')
        .not('points_balance', 'is', null);

      const totalPointsInCirculation = totalBalanceData?.reduce((sum, profile) => sum + (profile.points_balance || 0), 0) || 0;

      // Get total transactions
      const { count: totalTransactions } = await supabase
        .from('points_transactions')
        .select('*', { count: 'exact', head: true });

      // Calculate average balance
      const averageUserBalance = totalBalanceData?.length ? totalPointsInCirculation / totalBalanceData.length : 0;

      // Get top earners
      const { data: topEarnersData } = await supabase
        .from('points_transactions')
        .select('user_id, amount')
        .gt('amount', 0)
        .order('amount', { ascending: false })
        .limit(10);

      const topEarners = topEarnersData?.reduce((acc: any[], transaction) => {
        const existing = acc.find(user => user.userId === transaction.user_id);
        if (existing) {
          existing.totalEarned += transaction.amount;
        } else {
          acc.push({ userId: transaction.user_id, totalEarned: transaction.amount });
        }
        return acc;
      }, []).sort((a, b) => b.totalEarned - a.totalEarned).slice(0, 5) || [];

      return {
        totalPointsInCirculation,
        totalTransactions: totalTransactions || 0,
        averageUserBalance,
        topEarners
      };
    } catch (error) {
      console.error('Error getting points statistics:', error);
      return {
        totalPointsInCirculation: 0,
        totalTransactions: 0,
        averageUserBalance: 0,
        topEarners: []
      };
    }
  }
}
