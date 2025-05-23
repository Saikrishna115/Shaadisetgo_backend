const express = require('express');
const router = express.Router();
const { getFavorites, addFavorite, removeFavorite } = require('../controllers/favoriteController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes require authentication and customer role
router.use(protect);
router.use(restrictTo('customer'));

// Get user's favorite vendors
router.get('/', getFavorites);

// Add vendor to favorites
router.post('/', addFavorite);

// Remove vendor from favorites
router.delete('/:vendorId', removeFavorite);

module.exports = router; 