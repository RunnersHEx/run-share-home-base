import { env } from './envValidation';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = env.VITE_ENVIRONMENT === 'development';
  private isStaging = env.VITE_ENVIRONMENT === 'staging';
  private isProduction = env.VITE_ENVIRONMENT === 'production';

  private log(level: LogLevel, message: string, data?: any) {
    // Skip debug logs in production, allow in development and staging
    if (this.isProduction && level === 'debug') {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (data) {
      console[level](`${prefix} ${message}`, data);
    } else {
      console[level](`${prefix} ${message}`);
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, error?: any) {
    this.log('error', message, error);
    
    // In production and staging, errors could be sent to a service like Sentry
    // This would be configured when error tracking is implemented
    if ((this.isProduction || this.isStaging) && error) {
      // Future: Add error tracking service integration here
    }
  }
}

export const logger = new Logger();
