/**
 * Structured logging utility for GCP Cloud Logging
 * Outputs JSON logs that GCP can parse and index
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  severity: string;
  message: string;
  timestamp: string;
  service: string;
  environment: string;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
};

const isProduction = process.env.NODE_ENV === 'production';

function formatLog(level: LogLevel, message: string, context?: LogContext): LogEntry {
  return {
    severity: LOG_LEVELS[level],
    message,
    timestamp: new Date().toISOString(),
    service: 'mindweave',
    environment: process.env.NODE_ENV || 'development',
    ...context,
  };
}

function log(level: LogLevel, message: string, context?: LogContext): void {
  const entry = formatLog(level, message, context);

  if (isProduction) {
    // JSON output for GCP Cloud Logging
    console.log(JSON.stringify(entry));
  } else {
    // Human-readable output for development
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    const prefix = `[${level.toUpperCase()}]`;
    if (level === 'error') {
      console.error(`${prefix} ${message}${contextStr}`);
    } else if (level === 'warn') {
      console.warn(`${prefix} ${message}${contextStr}`);
    } else {
      console.log(`${prefix} ${message}${contextStr}`);
    }
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),
};

export default logger;
