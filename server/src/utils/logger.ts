import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Morgan stream
export const morganStream = {
  write: (message: string) => logger.http(message.trim())
};

// Export logger
export default logger;

// Utility functions
export const logError = (error: Error, context?: string) => {
  logger.error(`${context ? `[${context}] ` : ''}${error.message}`, {
    stack: error.stack,
    context
  });
};

export const logInfo = (message: string, data?: any) => {
  logger.info(message, data);
};

export const logWarn = (message: string, data?: any) => {
  logger.warn(message, data);
};

export const logDebug = (message: string, data?: any) => {
  logger.debug(message, data);
};

export const logHttp = (message: string, data?: any) => {
  logger.http(message, data);
};

// Performance logging
export const logPerformance = (operation: string, startTime: number, data?: any) => {
  const duration = Date.now() - startTime;
  logger.info(`Performance: ${operation} completed in ${duration}ms`, {
    operation,
    duration,
    ...data
  });
};

// Database operation logging
export const logDatabaseOperation = (operation: string, table: string, duration?: number, error?: Error) => {
  if (error) {
    logger.error(`Database Error: ${operation} on ${table} failed`, {
      operation,
      table,
      error: error.message,
      stack: error.stack
    });
  } else {
    logger.debug(`Database: ${operation} on ${table}${duration ? ` in ${duration}ms` : ''}`, {
      operation,
      table,
      duration
    });
  }
};

// Authentication logging
export const logAuthEvent = (event: string, userId?: string, email?: string, ip?: string, userAgent?: string) => {
  logger.info(`Auth: ${event}`, {
    event,
    userId,
    email,
    ip,
    userAgent
  });
};

// API request logging
export const logApiRequest = (method: string, url: string, userId?: string, ip?: string, duration?: number) => {
  logger.http(`API: ${method} ${url}`, {
    method,
    url,
    userId,
    ip,
    duration
  });
};

// Fingerprint operation logging
export const logFingerprintOperation = (operation: string, success: boolean, studentId?: string, error?: string) => {
  const level = success ? 'info' : 'warn';
  logger.log(level, `Fingerprint: ${operation} ${success ? 'succeeded' : 'failed'}`, {
    operation,
    success,
    studentId,
    error
  });
};
