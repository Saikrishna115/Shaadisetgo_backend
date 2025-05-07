const jwt = require('jsonwebtoken');

/**
 * Middleware to verify a valid JWT token from Authorization header.
 * Adds `req.user = decoded` if successful.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'No token provided or invalid format. Please use Bearer token.'
    });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // Should contain at least { userId, role }
    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid or expired token',
      error:
        err.name === 'TokenExpiredError'
          ? 'Token has expired'
          : 'Token validation failed'
    });
  }
};

module.exports = { verifyToken };
