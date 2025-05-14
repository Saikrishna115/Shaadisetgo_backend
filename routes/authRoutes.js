const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', register);

// Login
router.post('/login', login);

// Logout (Client just deletes token)
router.post('/logout', (req, res) => {
  res.status(200).json({ message: 'Logged out' });
});
router.get('/user', verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// Get current user profile
router.get('/me', verifyToken, getProfile);

module.exports = router;
