const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: 'No authorization header found. Please provide a token.'
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Invalid token format. Please use Bearer token format.'
    });
  }

  try {
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        message: 'No token found in authorization header.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ FIX: match the key used in generateToken
    if (!decoded.id) {
      return res.status(401).json({
        message: 'Invalid token payload. User ID not found.'
      });
    }

    req.user = { id: decoded.id }; // ✅ Use 'id' instead of 'userId'
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({
      message: 'Authentication failed',
      error: err.name === 'TokenExpiredError'
        ? 'Token has expired. Please login again.'
        : 'Invalid token. Please login again.'
    });
  }
};

module.exports = { verifyToken };
