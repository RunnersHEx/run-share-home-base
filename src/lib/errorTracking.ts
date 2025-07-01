
interface ErrorData {
  message: string;
  stack?: string;
  url: string;
  userId?: string;
  timestamp: number;
  userAgent: string;
  additionalData?: Record<string, any>;
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: ErrorData[] = [];

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  trackError(error: Error, additionalData?: Record<string, any>): void {
    const errorData: ErrorData = {
      message: error.message,
      stack: error.stack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      additionalData
    };

    console.error('Error tracked:', errorData);
    this.errors.push(errorData);

    // In production, send to error tracking service
    this.sendToService(errorData);
  }

  private async sendToService(errorData: ErrorData): Promise<void> {
    try {
      // In production, integrate with service like Sentry
      if (process.env.NODE_ENV === 'production') {
        // await fetch('/api/errors', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(errorData)
        // });
      }
    } catch (e) {
      console.error('Failed to send error to tracking service:', e);
    }
  }

  getErrors(): ErrorData[] {
    return this.errors;
  }

  clearErrors(): void {
    this.errors = [];
  }
}

export const errorTracker = ErrorTracker.getInstance();

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorTracker.trackError(new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.trackError(new Error(`Unhandled Promise Rejection: ${event.reason}`));
  });
}
