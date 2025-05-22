const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to allow only admin users.
 * Verifies token, fetches user from DB, and checks role.
 */
const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = adminMiddleware;
