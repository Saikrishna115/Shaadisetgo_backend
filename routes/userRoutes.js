const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    getUserProfile,
    updateUserProfile,
    deleteUserProfile
} = require('../controllers/userController');

// User profile routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.delete('/profile', protect, deleteUserProfile);
console.log('userController:', userController);

module.exports = router;