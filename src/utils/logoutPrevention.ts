import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

class LogoutPrevention {
  private refreshTimer: NodeJS.Timeout | null = null;
  private visibilityTimer: NodeJS.Timeout | null = null;
  private lastActivity: Date = new Date();
  
  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, () => {
        this.lastActivity = new Date();
      }, { passive: true });
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handlePageVisible();
      } else {
        this.handlePageHidden();
      }
    });

    // Handle online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Handle beforeunload to cleanup
    window.addEventListener('beforeunload', this.cleanup.bind(this));
  }

  private async handlePageVisible() {
    logger.debug('Page became visible, checking auth state');
    
    // Small delay to ensure DOM is ready
    this.visibilityTimer = setTimeout(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.warn('Session check error after page visible:', error);
        } else if (!session) {
          logger.warn('No session found after page became visible');
          // Attempt to restore session
          await this.attemptSessionRestore();
        } else {
          logger.debug('Session confirmed after page visible');
        }
      } catch (error) {
        logger.error('Error checking session after page visible:', error);
      }
    }, 100);
  }

  private handlePageHidden() {
    logger.debug('Page became hidden');
    
    if (this.visibilityTimer) {
      clearTimeout(this.visibilityTimer);
      this.visibilityTimer = null;
    }
  }

  private async handleOnline() {
    logger.debug('Connection restored, verifying session');
    
    try {
      // Wait a moment for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.warn('Session verification failed after reconnection:', error);
        await this.attemptSessionRestore();
      } else if (session) {
        logger.debug('Session verified after reconnection');
      }
    } catch (error) {
      logger.error('Error verifying session after reconnection:', error);
    }
  }

  private handleOffline() {
    logger.debug('Connection lost');
  }

  private async attemptSessionRestore() {
    try {
      logger.info('Attempting session restore...');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        logger.error('Session restore failed:', error);
        return false;
      }
      
      if (data.session) {
        logger.info('Session restored successfully');
        return true;
      }
      
      logger.warn('Session restore returned no session');
      return false;
    } catch (error) {
      logger.error('Session restore exception:', error);
      return false;
    }
  }

  public startPreventiveRefresh() {
    // Refresh token every 45 minutes (before 1-hour expiry)
    this.refreshTimer = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const expiresAt = new Date(session.expires_at * 1000);
          const timeUntilExpiry = expiresAt.getTime() - Date.now();
          
          // Refresh if less than 20 minutes remaining
          if (timeUntilExpiry < 20 * 60 * 1000) {
            logger.debug('Preventive token refresh');
            await supabase.auth.refreshSession();
          }
        }
      } catch (error) {
        logger.error('Preventive refresh failed:', error);
      }
    }, 45 * 60 * 1000); // Every 45 minutes
  }

  public stopPreventiveRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private cleanup() {
    this.stopPreventiveRefresh();
    
    if (this.visibilityTimer) {
      clearTimeout(this.visibilityTimer);
      this.visibilityTimer = null;
    }
  }

  // Public method to manually check and restore session
  public async checkAndRestoreSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return await this.attemptSessionRestore();
      }
      
      return true;
    } catch (error) {
      logger.error('Manual session check failed:', error);
      return false;
    }
  }

  // Check if user has been inactive for too long
  public getInactivityTime(): number {
    return Date.now() - this.lastActivity.getTime();
  }

  public isUserActive(thresholdMinutes: number = 30): boolean {
    return this.getInactivityTime() < thresholdMinutes * 60 * 1000;
  }
}

// Create singleton instance
export const logoutPrevention = new LogoutPrevention();

// Auto-start preventive measures
logoutPrevention.startPreventiveRefresh();

// Export the class for manual instantiation if needed
export { LogoutPrevention };
