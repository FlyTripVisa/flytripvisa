/**
 * Logger Utility
 * Provides consistent logging across the application
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  data?: any;
}

class Logger {
  private isDevelopment = true;

  setEnvironment(environment: string) {
    this.isDevelopment = environment === 'development';
  }

  private formatLog(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      timestamp: new Date().toISOString(),
      message,
      ...(data && { data }),
    };
  }

  private log(level: LogLevel, message: string, data?: any) {
    const logEntry = this.formatLog(level, message, data);

    if (this.isDevelopment) {
      const output = {
        ...logEntry,
        data: data || undefined,
      };
      console[level === 'debug' ? 'log' : level](JSON.stringify(output, null, 2));
    } else {
      // In production, send to Cloudflare Logpush or similar
      console[level === 'debug' ? 'log' : level](
        `[${logEntry.level.toUpperCase()}] ${logEntry.timestamp} - ${logEntry.message}`,
        data ? JSON.stringify(data) : ''
      );
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

  error(message: string, data?: any) {
    this.log('error', message, data);
  }
}

export const logger = new Logger();
