const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();
router.get('/me', authMiddleware, async (req, res) => {
    try {
      // req.user should be set in your middleware
      res.json(req.user);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  router.post('/logout', (req, res) => {
    // No server-side action needed if you're using JWT
    res.status(200).json({ message: 'Logged out' });
  });  
router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getProfile);

module.exports = router;
