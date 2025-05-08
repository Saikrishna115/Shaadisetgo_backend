const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { 
    getUserProfile,
    updateUserProfile,
    deleteUserProfile
} = (req, res) => {
    res.send('User profile');
};
// User profile routes
router.get('/profile', auth, getUserProfile);
router.put('/profile', auth, updateUserProfile);
router.delete('/profile', auth, deleteUserProfile);
console.log('userController.getUserProfile:', typeof userController.getUserProfile);

module.exports = router;