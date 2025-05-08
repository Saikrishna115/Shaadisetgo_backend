console.log('DEBUG TYPES:', {
    getUserProfile: typeof getUserProfile,
    updateUserProfile: typeof updateUserProfile,
    deleteUserProfile: typeof deleteUserProfile
  });
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

// ✅ Correctly import the controller functions
const {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile
} = require('../controllers/userController');  // <<-- Make sure this path is correct

// ✅ Route definitions using controller functions
router.get('/profile', auth, getUserProfile);
router.put('/profile', auth, updateUserProfile);
router.delete('/profile', auth, deleteUserProfile);

module.exports = router;
