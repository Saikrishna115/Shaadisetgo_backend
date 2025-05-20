const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify JWT token and attach user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authorize = (role) => {
  return (req, res, next) => {
    if (req.user && req.user.role === role) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions.'
    });
  };
};

const verifyToken = async (req, res, next) => {
  try {
    // Check for token in Authorization header or secure cookie
    let token = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.'
      });
    }

    // Verify token with strong secret from environment variables
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], // Explicitly specify the algorithm
    });

    if (!decoded._id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload. User ID not found.'
      });
    }

    // Fetch user from database to ensure they still exist and are active
    const user = await User.findById(decoded._id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or deactivated.'
      });
    }

    // Attach user object to request for use in subsequent middleware/routes
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: err.name === 'TokenExpiredError' 
        ? 'Token has expired. Please login again.' 
        : 'Invalid token. Please login again.'
    });
  }
};

module.exports = { verifyToken, authorize };
