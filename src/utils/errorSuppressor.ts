import { ErrorInfo } from 'react';

/**
 * Utility to handle known safe-to-ignore DOM manipulation errors
 * These errors are common in React applications during cleanup phases
 */
export class ErrorSuppressor {
  private static knownSafeErrors = [
    "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node",
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured'
  ];

  /**
   * Checks if an error is safe to ignore
   * @param error The error to check
   * @returns true if the error can be safely ignored
   */
  static isSafeToIgnore(error: Error): boolean {
    const message = error.message || '';
    
    return this.knownSafeErrors.some(safeError => 
      message.includes(safeError) || 
      error.name === 'NotFoundError'
    );
  }

  /**
   * Enhanced error boundary catch that filters out safe errors
   * @param error The caught error
   * @param errorInfo React error info
   * @returns true if error should be handled normally, false if suppressed
   */
  static shouldHandleError(error: Error, errorInfo?: ErrorInfo): boolean {
    // Always handle errors in development for debugging
    if (process.env.NODE_ENV === 'development') {
      // But log suppressed errors differently
      if (this.isSafeToIgnore(error)) {
        console.warn('Suppressed safe DOM error (harmless):', error.message);
        return false;
      }
      return true;
    }

    // In production, suppress safe errors
    if (this.isSafeToIgnore(error)) {
      console.warn('Suppressed DOM manipulation error:', error.message);
      return false;
    }

    return true;
  }

  /**
   * Wraps error tracking to filter out safe errors
   * @param error The error to potentially track
   * @param context Additional context
   */
  static trackErrorIfSignificant(error: Error, context?: any): void {
    if (this.shouldHandleError(error)) {
      // Only import errorTracker when we actually need it
      import('../lib/errorTracking').then(({ errorTracker }) => {
        errorTracker.trackError(error, context);
      });
    }
  }
}
