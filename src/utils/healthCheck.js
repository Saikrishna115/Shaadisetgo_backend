const mongoose = require('mongoose');
const logger = require('./logger');
const databaseManager = require('../config/database');

class HealthCheck {
  static async checkDatabaseConnection() {
    try {
      if (mongoose.connection.readyState !== 1) {
        return {
          status: 'error',
          service: 'database',
          message: 'Database not connected',
          details: databaseManager.getStatus()
        };
      }

      // Test database operation
      await mongoose.connection.db.admin().ping();

      return {
        status: 'ok',
        service: 'database',
        details: databaseManager.getStatus()
      };
    } catch (error) {
      logger.error({
        message: 'Database health check failed',
        error: error.message
      });

      return {
        status: 'error',
        service: 'database',
        message: error.message,
        details: databaseManager.getStatus()
      };
    }
  }

  static async checkMemoryUsage() {
    const used = process.memoryUsage();
    const memoryUsage = {
      rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(used.external / 1024 / 1024)}MB`
    };

    return {
      status: 'ok',
      service: 'memory',
      details: memoryUsage
    };
  }

  static async getConnectionStats() {
    if (mongoose.connection.readyState !== 1) {
      return {
        status: 'error',
        message: 'Database not connected'
      };
    }

    try {
      const stats = await mongoose.connection.db.stats();
      const serverStatus = await mongoose.connection.db.admin().serverStatus();

      return {
        status: 'ok',
        details: {
          collections: stats.collections,
          documents: stats.objects,
          indexes: stats.indexes,
          avgObjSize: stats.avgObjSize,
          dataSize: `${Math.round(stats.dataSize / 1024 / 1024)}MB`,
          connections: {
            current: serverStatus.connections.current,
            available: serverStatus.connections.available,
            totalCreated: serverStatus.connections.totalCreated
          },
          operations: serverStatus.opcounters
        }
      };
    } catch (error) {
      logger.error({
        message: 'Error getting database stats',
        error: error.message
      });

      return {
        status: 'error',
        message: error.message
      };
    }
  }

  static async fullCheck() {
    const [dbHealth, memoryHealth, connectionStats] = await Promise.all([
      this.checkDatabaseConnection(),
      this.checkMemoryUsage(),
      this.getConnectionStats()
    ]);

    const systemHealth = {
      timestamp: new Date().toISOString(),
      status: dbHealth.status === 'ok' ? 'healthy' : 'unhealthy',
      database: dbHealth,
      memory: memoryHealth,
      connections: connectionStats
    };

    // Log health check results
    if (systemHealth.status === 'unhealthy') {
      logger.warn({
        message: 'System health check failed',
        health: systemHealth
      });
    } else {
      logger.info({
        message: 'System health check passed',
        health: systemHealth
      });
    }

    return systemHealth;
  }
}

module.exports = HealthCheck; 