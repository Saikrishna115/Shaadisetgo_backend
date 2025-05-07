const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getProfile);
router.get('/profile', verifyToken, getProfile); // Keeping for backward compatibility

module.exports = router;
