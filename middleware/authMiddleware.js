const jwt = require('jsonwebtoken');

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

    req.user = decoded;
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

module.exports = verifyToken; // ✅ export as function directly
