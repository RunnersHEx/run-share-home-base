import { supabase } from "@/integrations/supabase/client";
import { NotificationBackgroundJobs, NotificationService } from "./notificationService";
import { PointsCalculationService } from "./pointsCalculationService";

export interface ScheduledJob {
  id: string;
  name: string;
  schedule: string; // cron-like schedule
  lastRun?: Date;
  nextRun?: Date;
  isActive: boolean;
  handler: () => Promise<void>;
}

export class BackgroundJobScheduler {
  private static instance: BackgroundJobScheduler;
  private jobs: Map<string, ScheduledJob> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  private constructor() {
    this.initializeJobs();
  }

  static getInstance(): BackgroundJobScheduler {
    if (!BackgroundJobScheduler.instance) {
      BackgroundJobScheduler.instance = new BackgroundJobScheduler();
    }
    return BackgroundJobScheduler.instance;
  }

  private initializeJobs() {
    // Define all background jobs for the booking system
    const jobs: Omit<ScheduledJob, 'id'>[] = [
      {
        name: 'Check Expired Bookings',
        schedule: '*/15 * * * *', // Every 15 minutes
        isActive: true,
        handler: this.checkExpiredBookings
      },
      {
        name: 'Send Deadline Reminders',
        schedule: '0 */6 * * *', // Every 6 hours
        isActive: true,
        handler: this.sendDeadlineReminders
      },
      {
        name: 'Auto Confirm Bookings',
        schedule: '0 12 * * *', // Daily at noon
        isActive: true,
        handler: this.autoConfirmBookings
      },
      {
        name: 'Auto Complete Bookings',
        schedule: '0 14 * * *', // Daily at 2 PM
        isActive: true,
        handler: this.autoCompleteBookings
      },
      {
        name: 'Recalculate Race Points',
        schedule: '0 2 * * *', // Daily at 2 AM
        isActive: true,
        handler: this.recalculateRacePoints
      },
      {
        name: 'Send Review Prompts',
        schedule: '0 18 * * *', // Daily at 6 PM
        isActive: true,
        handler: this.sendReviewPrompts
      },
      {
        name: 'Cleanup Old Notifications',
        schedule: '0 1 * * 0', // Weekly on Sunday at 1 AM
        isActive: true,
        handler: this.cleanupOldNotifications
      }
    ];

    jobs.forEach(job => {
      const id = this.generateJobId(job.name);
      this.jobs.set(id, {
        ...job,
        id,
        lastRun: undefined,
        nextRun: this.calculateNextRun(job.schedule)
      });
    });
  }

  private generateJobId(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '_');
  }

  private calculateNextRun(schedule: string): Date {
    // Simplified cron parsing - in production, use a proper cron library
    const now = new Date();
    const parts = schedule.split(' ');
    
    if (schedule.startsWith('*/')) {
      const minutes = parseInt(schedule.split('/')[1].split(' ')[0]);
      return new Date(now.getTime() + minutes * 60 * 1000);
    }
    
    // For hourly jobs
    if (schedule.includes('*/6')) {
      return new Date(now.getTime() + 6 * 60 * 60 * 1000);
    }
    
    // For daily jobs
    if (schedule.startsWith('0 ')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const hour = parseInt(parts[1]);
      tomorrow.setHours(hour, 0, 0, 0);
      return tomorrow;
    }
    
    // Default: 1 hour from now
    return new Date(now.getTime() + 60 * 60 * 1000);
  }

  start() {
    if (this.isRunning) return;
    
    console.log('BackgroundJobScheduler: Starting job scheduler');
    this.isRunning = true;
    
    // Check every minute for jobs that need to run
    const masterInterval = setInterval(() => {
      this.checkAndRunJobs();
    }, 60 * 1000); // 1 minute
    
    this.intervals.set('master', masterInterval);
  }

  stop() {
    if (!this.isRunning) return;
    
    console.log('BackgroundJobScheduler: Stopping job scheduler');
    this.isRunning = false;
    
    // Clear all intervals safely
    this.intervals.forEach((interval, key) => {
      try {
        clearInterval(interval);
      } catch (error) {
        console.warn(`BackgroundJobScheduler: Error clearing interval ${key}:`, error);
      }
    });
    this.intervals.clear();
  }

  private async checkAndRunJobs() {
    // Don't run jobs if scheduler is shutting down or app is unloading
    if (!this.isRunning || document.visibilityState === 'hidden') {
      return;
    }
    
    const now = new Date();
    
    for (const [id, job] of this.jobs) {
      if (!job.isActive || !job.nextRun || !this.isRunning) continue;
      
      if (now >= job.nextRun) {
        console.log(`BackgroundJobScheduler: Running job "${job.name}"`);
        
        try {
          await job.handler();
          job.lastRun = now;
          job.nextRun = this.calculateNextRun(job.schedule);
          
          console.log(`BackgroundJobScheduler: Job "${job.name}" completed successfully`);
        } catch (error) {
          console.error(`BackgroundJobScheduler: Job "${job.name}" failed:`, error);
          // Reschedule for 5 minutes later on failure
          job.nextRun = new Date(now.getTime() + 5 * 60 * 1000);
        }
      }
    }
  }

  // Job handlers
  private async checkExpiredBookings(): Promise<void> {
    try {
      const { error } = await supabase.rpc('check_expired_bookings');
      if (error) throw error;
      console.log('Expired bookings check completed');
    } catch (error) {
      console.error('Error checking expired bookings:', error);
    }
  }

  private async sendDeadlineReminders(): Promise<void> {
    try {
      await NotificationBackgroundJobs.checkDeadlineReminders();
      console.log('Deadline reminders sent');
    } catch (error) {
      console.error('Error sending deadline reminders:', error);
    }
  }

  private async autoConfirmBookings(): Promise<void> {
    try {
      const { error } = await supabase.rpc('auto_confirm_bookings');
      if (error) throw error;
      
      // Also run notification check for confirmations
      await NotificationBackgroundJobs.checkBookingConfirmations();
      console.log('Auto booking confirmations completed');
    } catch (error) {
      console.error('Error auto-confirming bookings:', error);
    }
  }

  private async autoCompleteBookings(): Promise<void> {
    try {
      const { error } = await supabase.rpc('auto_complete_bookings');
      if (error) throw error;
      
      // Also run notification check for completions
      await NotificationBackgroundJobs.checkBookingCompletions();
      console.log('Auto booking completions processed');
    } catch (error) {
      console.error('Error auto-completing bookings:', error);
    }
  }

  private async recalculateRacePoints(): Promise<void> {
    try {
      await PointsCalculationService.recalculateAllRacePoints();
      console.log('Race points recalculation completed');
    } catch (error) {
      console.error('Error recalculating race points:', error);
    }
  }

  private async sendReviewPrompts(): Promise<void> {
    try {
      // Send review prompts for bookings completed 2-7 days ago
      const { data: completedBookings } = await supabase
        .from('bookings')
        .select(`
          *,
          guest:profiles!bookings_guest_id_profiles_fkey(first_name, last_name),
          host:profiles!bookings_host_id_profiles_fkey(first_name, last_name),
          property:properties(title)
        `)
        .eq('status', 'completed')
        .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .lte('completed_at', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString());

      if (completedBookings) {
        for (const booking of completedBookings) {
          // Check if review prompt already sent
          const { data: existingPrompt } = await supabase
            .from('user_notifications')
            .select('id')
            .eq('type', NotificationService.TYPES.REVIEW_PROMPT)
            .eq('data->booking_id', booking.id);

          if (!existingPrompt || existingPrompt.length === 0) {
            await NotificationService.notifyReviewPrompt(booking);
          }
        }
      }
      
      console.log('Review prompts sent');
    } catch (error) {
      console.error('Error sending review prompts:', error);
    }
  }

  private async cleanupOldNotifications(): Promise<void> {
    try {
      // Delete notifications older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;
      console.log('Old notifications cleanup completed');
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }

  // Public methods for manual job management
  runJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job with id "${jobId}" not found`);
    }
    
    return job.handler();
  }

  getJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  enableJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.isActive = true;
    }
  }

  disableJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.isActive = false;
    }
  }
}

// Initialize and start the scheduler when the module is loaded
// In a production environment, this might be done in the main app initialization
let scheduler: BackgroundJobScheduler | null = null;
let cleanupRegistered = false;

export const initializeBackgroundJobs = () => {
  if (typeof window !== 'undefined' && !scheduler) {
    scheduler = BackgroundJobScheduler.getInstance();
    scheduler.start();
    
    // Register cleanup only once to avoid multiple listeners
    if (!cleanupRegistered) {
      cleanupRegistered = true;
      
      // Use a more gentle cleanup approach
      const cleanup = () => {
        if (scheduler) {
          try {
            scheduler.stop();
            scheduler = null;
          } catch (error) {
            console.warn('Background job cleanup error (safe to ignore):', error);
          }
        }
      };
      
      // Use multiple cleanup opportunities but make them safe
      window.addEventListener('beforeunload', cleanup, { once: true });
      window.addEventListener('pagehide', cleanup, { once: true });
      
      // Also cleanup on visibility change (when tab becomes hidden)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          cleanup();
        }
      }, { once: true });
    }
  }
};

export const getScheduler = () => scheduler;
