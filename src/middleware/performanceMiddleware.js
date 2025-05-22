const compression = require('compression');
const { cache } = require('../utils/cache');

// Configure compression middleware
const compressionMiddleware = compression({
  level: 6, // Compression level (0-9, higher = better compression but more CPU)
  threshold: 1024, // Only compress responses above 1KB
  filter: (req, res) => {
    // Don't compress responses with this header
    if (req.headers['x-no-compression']) return false;
    // Use compression filter function
    return compression.filter(req, res);
  }
});

// Cache middleware for GET requests
const cacheMiddleware = (duration = 3600) => {
  return async (req, res, next) => {
    try {
      // Only cache GET requests
      if (req.method !== 'GET') return next();

      const key = `__express__${req.originalUrl || req.url}`;
      const cachedResponse = cache.get(key);

      if (cachedResponse) {
        res.send(cachedResponse);
        return;
      }

      // Store the original send
      const originalSend = res.send;

      // Override send
      res.send = function(body) {
        try {
          // Store the response in cache
          cache.set(key, body, duration);
          
          // Call the original send
          originalSend.call(this, body);
        } catch (error) {
          console.error('Cache middleware error during response:', error);
          originalSend.call(this, body);
        }
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(error);
    }
  };
};

// Rate limiting middleware using cache
const rateLimit = (requests = 100, period = 3600) => {
  return async (req, res, next) => {
    try {
      if (!req.ip) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request: IP address not found'
        });
      }

      const ip = req.ip;
      const key = `rate_limit_${ip}`;
      
      let requests_made = cache.get(key) || 0;
      
      if (requests_made >= requests) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later.',
          retryAfter: period
        });
      }
      
      await cache.set(key, requests_made + 1, period);
      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      next(error);
    }
  };
};

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  try {
    const start = process.hrtime();

    res.on('finish', () => {
      try {
        const [seconds, nanoseconds] = process.hrtime(start);
        const duration = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds

        // Log slow requests (over 1 second)
        if (duration > 1000) {
          console.warn(`Slow request: ${req.method} ${req.originalUrl} took ${duration.toFixed(2)}ms`, {
            method: req.method,
            path: req.originalUrl,
            duration: duration.toFixed(2),
            statusCode: res.statusCode
          });
        }
      } catch (error) {
        console.error('Performance monitoring calculation error:', error);
      }
    });

    next();
  } catch (error) {
    console.error('Performance monitoring setup error:', error);
    next(error);
  }
};

module.exports = {
  compressionMiddleware,
  cacheMiddleware,
  rateLimit,
  performanceMonitor
};