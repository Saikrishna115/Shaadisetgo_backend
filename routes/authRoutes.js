const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/authMiddleware');
const { register, login } = require('../controllers/authController');

// Register
router.post('/register', register);

// Login
router.post('/login', login);

// Logout
router.post('/logout', (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});

// Get current user profile
router.get('/user', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone
    });
  } catch (err) {
    console.error('Get user profile error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

module.exports = router;
