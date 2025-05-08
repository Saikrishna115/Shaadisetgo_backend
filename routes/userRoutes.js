const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware'); // ✅ now this is the middleware function

const {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile
} = require('../controllers/userController');

// User profile routes
router.get('/profile', auth, getUserProfile);
router.put('/profile', auth, updateUserProfile);
router.delete('/profile', auth, deleteUserProfile);

module.exports = router;
