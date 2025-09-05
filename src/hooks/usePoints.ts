import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PointsCalculationService } from '@/services/pointsCalculationService';
import { PointsManagementService, PointsBalance, PointsTransaction } from '@/services/pointsManagementService';

/**
 * Hook for managing user's points balance and transactions
 */
export const usePoints = (userId: string | null) => {
  const [balance, setBalance] = useState<number>(0);
  const [pointsSummary, setPointsSummary] = useState<PointsBalance>({
    current_balance: 0,
    total_earned: 0,
    total_spent: 0,
    total_penalties: 0
  });
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refreshBalance = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const newBalance = await PointsCalculationService.getUserPointsBalance(userId);
      setBalance(newBalance);
    } catch (err) {
      console.error('Error refreshing balance:', err);
      setError('Failed to refresh points balance');
    } finally {
      setLoading(false);
    }
  };

  const refreshPointsSummary = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const summary = await PointsManagementService.getUserPointsSummary(userId);
      setPointsSummary(summary);
      setBalance(summary.current_balance);
    } catch (err) {
      console.error('Error refreshing points summary:', err);
      setError('Failed to refresh points summary');
    } finally {
      setLoading(false);
    }
  };

  const refreshTransactions = async (limit = 50) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const newTransactions = await PointsManagementService.getUserPointsHistory(userId, limit);
      setTransactions(newTransactions);
    } catch (err) {
      console.error('Error refreshing transactions:', err);
      setError('Failed to refresh transaction history');
    } finally {
      setLoading(false);
    }
  };

  const checkSufficientPoints = async (requiredPoints: number): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      return await PointsManagementService.validateSufficientPoints(userId, requiredPoints);
    } catch (err) {
      console.error('Error checking sufficient points:', err);
      return false;
    }
  };

  const awardPoints = async (action: string, additionalData?: any) => {
    if (!userId) return;
    
    try {
      await PointsCalculationService.awardActionPoints(action, userId, additionalData);
      await refreshBalance();
      toast({
        title: "Points Awarded!",
        description: `You've earned points for ${action.replace('_', ' ')}`,
      });
    } catch (err) {
      console.error('Error awarding points:', err);
      toast({
        title: "Error",
        description: "Failed to award points",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (userId) {
      refreshBalance();
      refreshPointsSummary();
      refreshTransactions();
    }
  }, [userId]);

  return {
    balance,
    pointsSummary,
    transactions,
    loading,
    error,
    refreshBalance,
    refreshPointsSummary,
    refreshTransactions,
    checkSufficientPoints,
    awardPoints
  };
};

/**
 * Hook for calculating booking costs using provincial points system
 */
export const useBookingCost = () => {
  const [cost, setCost] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateCost = async (raceId: string, checkInDate: string, checkOutDate: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const calculatedCost = await PointsCalculationService.calculateProvincialBookingCost({
        raceId,
        checkInDate,
        checkOutDate
      });
      
      setCost(calculatedCost);
      return calculatedCost;
    } catch (err) {
      console.error('Error calculating booking cost:', err);
      setError('Failed to calculate booking cost');
      return 0;
    } finally {
      setLoading(false);
    }
  };

  const getProvincialRate = (province: string): number => {
    return PointsCalculationService.getProvincialPointsPerNight(province);
  };

  const getAllProvincialRates = (): Record<string, number> => {
    return PointsCalculationService.getAllProvincialPoints();
  };

  return {
    cost,
    loading,
    error,
    calculateCost,
    getProvincialRate,
    getAllProvincialRates
  };
};

/**
 * Hook for processing booking payments
 */
export const useBookingPayment = () => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const processPayment = async (bookingData: {
    bookingId: string;
    guestId: string;
    hostId: string;
    raceId: string;
    checkInDate: string;
    checkOutDate: string;
  }): Promise<number> => {
    try {
      setProcessing(true);
      setError(null);
      
      const cost = await PointsManagementService.processBookingPayment(bookingData);
      
      toast({
        title: "Payment Processed",
        description: `${cost} points deducted successfully`,
      });
      
      return cost;
    } catch (err) {
      console.error('Error processing payment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process payment';
      setError(errorMessage);
      
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  const processRefund = async (bookingId: string, guestId: string, hostId: string, amount: number) => {
    try {
      setProcessing(true);
      setError(null);
      
      await PointsManagementService.processBookingRefund(bookingId, guestId, hostId, amount);
      
      toast({
        title: "Refund Processed",
        description: `${amount} points refunded successfully`,
      });
    } catch (err) {
      console.error('Error processing refund:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process refund';
      setError(errorMessage);
      
      toast({
        title: "Refund Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  return {
    processing,
    error,
    processPayment,
    processRefund
  };
};

/**
 * Hook for managing points awards and penalties
 */
export const usePointsActions = () => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const awardHostingPoints = async (bookingId: string, hostId: string, checkInDate: string, checkOutDate: string) => {
    try {
      setProcessing(true);
      await PointsManagementService.awardHostingPoints(bookingId, hostId, checkInDate, checkOutDate);
      toast({
        title: "Hosting Points Awarded!",
        description: "You've earned points for hosting",
      });
    } catch (err) {
      console.error('Error awarding hosting points:', err);
      setError('Failed to award hosting points');
    } finally {
      setProcessing(false);
    }
  };

  const awardPropertyPoints = async (userId: string, propertyTitle: string) => {
    try {
      setProcessing(true);
      await PointsManagementService.awardPropertyPoints(userId, propertyTitle);
      toast({
        title: "Property Points Awarded!",
        description: "You've earned 30 points for adding a property",
      });
    } catch (err) {
      console.error('Error awarding property points:', err);
      setError('Failed to award property points');
    } finally {
      setProcessing(false);
    }
  };

  const awardRacePoints = async (userId: string, raceName: string) => {
    try {
      setProcessing(true);
      await PointsManagementService.awardRacePoints(userId, raceName);
      toast({
        title: "Race Points Awarded!",
        description: "You've earned 40 points for adding a race",
      });
    } catch (err) {
      console.error('Error awarding race points:', err);
      setError('Failed to award race points');
    } finally {
      setProcessing(false);
    }
  };

  const awardReviewPoints = async (userId: string, bookingId: string) => {
    try {
      setProcessing(true);
      await PointsManagementService.awardReviewPoints(userId, bookingId);
      toast({
        title: "Review Points Awarded!",
        description: "You've earned 15 points for a 5-star review",
      });
    } catch (err) {
      console.error('Error awarding review points:', err);
      setError('Failed to award review points');
    } finally {
      setProcessing(false);
    }
  };

  const awardVerificationPoints = async (userId: string) => {
    try {
      setProcessing(true);
      await PointsManagementService.awardVerificationPoints(userId);
      toast({
        title: "Verification Points Awarded!",
        description: "You've earned 25 points for identity verification",
      });
    } catch (err) {
      console.error('Error awarding verification points:', err);
      setError('Failed to award verification points');
    } finally {
      setProcessing(false);
    }
  };

  const awardSubscriptionPoints = async (userId: string, isRenewal = false) => {
    try {
      setProcessing(true);
      if (isRenewal) {
        await PointsManagementService.awardRenewalPoints(userId);
        toast({
          title: "Renewal Points Awarded!",
          description: "You've earned 50 points for subscription renewal",
        });
      } else {
        await PointsManagementService.awardNewSubscriberPoints(userId);
        toast({
          title: "Welcome Bonus!",
          description: "You've earned 30 points for subscribing",
        });
      }
    } catch (err) {
      console.error('Error awarding subscription points:', err);
      setError('Failed to award subscription points');
    } finally {
      setProcessing(false);
    }
  };

  const applyCancellationPenalty = async (bookingId: string, hostId: string, guestId: string, originalCost: number) => {
    try {
      setProcessing(true);
      await PointsManagementService.applyHostCancellationPenalty(bookingId, hostId, guestId, originalCost);
      toast({
        title: "Cancellation Penalty Applied",
        description: "Points have been deducted for host cancellation",
        variant: "destructive",
      });
    } catch (err) {
      console.error('Error applying cancellation penalty:', err);
      setError('Failed to apply cancellation penalty');
    } finally {
      setProcessing(false);
    }
  };

  return {
    processing,
    error,
    awardHostingPoints,
    awardPropertyPoints,
    awardRacePoints,
    awardReviewPoints,
    awardVerificationPoints,
    awardSubscriptionPoints,
    applyCancellationPenalty
  };
};

/**
 * Hook for points statistics (admin/dashboard)
 */
export const usePointsStatistics = () => {
  const [statistics, setStatistics] = useState({
    totalPointsInCirculation: 0,
    totalTransactions: 0,
    averageUserBalance: 0,
    topEarners: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatistics = async () => {
    try {
      setLoading(true);
      const stats = await PointsManagementService.getPointsStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Error fetching points statistics:', err);
      setError('Failed to fetch points statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStatistics();
  }, []);

  return {
    statistics,
    loading,
    error,
    refreshStatistics
  };
};
