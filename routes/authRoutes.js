const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Register
router.post('/register', register);

// Login
router.post('/login', login);

// Logout (Client just deletes token)
router.post('/logout', (req, res) => {
  res.status(200).json({ message: 'Logged out' });
});

// Get current user profile
router.get('/me', verifyToken, getProfile);

module.exports = router;
