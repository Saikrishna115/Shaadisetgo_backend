const express = require('express');
const router = express.Router();
const HealthCheck = require('../utils/healthCheck');
const { apiLimiter } = require('../middleware/securityMiddleware');

// Basic health check
router.get('/health', apiLimiter, async (req, res) => {
  try {
    const dbHealth = await HealthCheck.checkDatabaseConnection();
    
    res.status(dbHealth.status === 'ok' ? 200 : 503).json({
      status: dbHealth.status,
      timestamp: new Date().toISOString(),
      database: dbHealth
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Detailed system health check (protected route)
router.get('/health/details', apiLimiter, async (req, res) => {
  try {
    const systemHealth = await HealthCheck.fullCheck();
    
    res.status(systemHealth.status === 'healthy' ? 200 : 503).json(systemHealth);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Detailed health check failed',
      error: error.message
    });
  }
});

module.exports = router; 