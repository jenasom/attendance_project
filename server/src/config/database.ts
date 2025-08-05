import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

// Global Prisma instance
let prisma: PrismaClient | null = null;

/**
 * Database configuration interface
 */
interface DatabaseConfig {
  url: string;
  maxConnections: number;
  connectionTimeout: number;
  logLevel: 'info' | 'query' | 'warn' | 'error';
  enableLogging: boolean;
}

/**
 * Get database configuration from environment variables
 */
const getDatabaseConfig = (): DatabaseConfig => {
  return {
    url: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/bioattendancesysdb',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '60000'),
    logLevel: (process.env.DB_LOG_LEVEL as any) || 'warn',
    enableLogging: process.env.DB_ENABLE_LOGGING === 'true' || process.env.NODE_ENV === 'development'
  };
};

/**
 * Create and configure Prisma client instance
 */
const createPrismaClient = (): PrismaClient => {
  const config = getDatabaseConfig();

  const client = new PrismaClient({
    datasources: {
      db: {
        url: config.url
      }
    },
    log: config.enableLogging
      ? [
          { level: 'query', emit: 'event' },
          { level: 'info', emit: 'event' },
          { level: 'warn', emit: 'event' },
          { level: 'error', emit: 'event' }
        ]
      : ['error'],
    errorFormat: 'pretty'
  });

  // Set up logging if enabled
  if (config.enableLogging) {
    client.$on('query', (e) => {
      logger.debug('Database Query', {
        query: e.query,
        params: e.params,
        duration: e.duration,
        target: e.target
      });
    });

    client.$on('info', (e) => {
      logger.info('Database Info', {
        message: e.message,
        target: e.target
      });
    });

    client.$on('warn', (e) => {
      logger.warn('Database Warning', {
        message: e.message,
        target: e.target
      });
    });

    client.$on('error', (e) => {
      logger.error('Database Error', {
        message: e.message,
        target: e.target
      });
    });
  }

  return client;
};

/**
 * Get or create Prisma client instance (singleton pattern)
 */
export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = createPrismaClient();
    logger.info('Database client initialized');
  }
  return prisma;
};

/**
 * Test database connection
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    logger.info('Database connection test successful');
    return true;
  } catch (error) {
    logger.error('Database connection test failed', error);
    return false;
  }
};

/**
 * Initialize database connection and run health checks
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    const client = getPrismaClient();
    
    // Test connection
    await client.$connect();
    logger.info('Database connected successfully');

    // Run a simple health check
    const isHealthy = await testDatabaseConnection();
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }

    // Log database info
    const result = await client.$queryRaw`SELECT VERSION() as version` as any[];
    if (result && result[0] && result[0].version) {
      logger.info(`Database version: ${result[0].version}`);
    }

  } catch (error) {
    logger.error('Failed to initialize database', error);
    throw error;
  }
};

/**
 * Gracefully disconnect from database
 */
export const disconnectDatabase = async (): Promise<void> => {
  if (prisma) {
    try {
      await prisma.$disconnect();
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from database', error);
    } finally {
      prisma = null;
    }
  }
};

/**
 * Database transaction wrapper with error handling and logging
 */
export const withTransaction = async <T>(
  operation: (client: PrismaClient) => Promise<T>,
  operationName?: string
): Promise<T> => {
  const client = getPrismaClient();
  const startTime = Date.now();
  
  try {
    const result = await client.$transaction(async (tx) => {
      return await operation(tx as PrismaClient);
    });
    
    const duration = Date.now() - startTime;
    logger.info(`Transaction completed: ${operationName || 'unknown'}`, { 
      duration: `${duration}ms` 
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Transaction failed: ${operationName || 'unknown'}`, {
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

/**
 * Database query wrapper with performance logging
 */
export const withPerformanceLogging = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  table?: string
): Promise<T> => {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    logger.debug(`Database operation completed: ${operationName}`, {
      table,
      duration: `${duration}ms`
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error(`Database operation failed: ${operationName}`, {
      table,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
};

/**
 * Database health check endpoint data
 */
export const getDatabaseHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  details: {
    connected: boolean;
    version?: string;
    responseTime?: number;
    error?: string;
  };
}> => {
  const startTime = Date.now();
  
  try {
    const client = getPrismaClient();
    
    // Test basic connectivity
    await client.$queryRaw`SELECT 1`;
    
    // Get database version
    const versionResult = await client.$queryRaw`SELECT VERSION() as version` as any[];
    const version = versionResult[0]?.version;
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      details: {
        connected: true,
        version,
        responseTime
      }
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'unhealthy',
      details: {
        connected: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
};

/**
 * Get database statistics
 */
export const getDatabaseStats = async (): Promise<{
  tables: {
    users: number;
    courses: number;
    students: number;
    studentCourses: number;
    attendances: number;
  };
  totalRecords: number;
}> => {
  const client = getPrismaClient();
  
  try {
    const [
      userCount,
      courseCount,
      studentCount,
      studentCourseCount,
      attendanceCount
    ] = await Promise.all([
      client.user.count(),
      client.course.count(),
      client.student.count(),
      client.studentCourse.count(),
      client.attendance.count()
    ]);
    
    const totalRecords = userCount + courseCount + studentCount + studentCourseCount + attendanceCount;
    
    return {
      tables: {
        users: userCount,
        courses: courseCount,
        students: studentCount,
        studentCourses: studentCourseCount,
        attendances: attendanceCount
      },
      totalRecords
    };
  } catch (error) {
    logger.error('Failed to get database statistics', error);
    throw error;
  }
};

// Export singleton instance
export default getPrismaClient;
