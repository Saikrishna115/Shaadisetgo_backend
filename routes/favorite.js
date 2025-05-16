const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getFavorites,
  addFavorite,
  removeFavorite
} = require('../controllers/favoriteController');

/**
 * @route   GET /api/favorites
 * @desc    Get user's favorite vendors
 * @access  Private
 */
router.get('/', verifyToken, getFavorites);

/**
 * @route   POST /api/favorites
 * @desc    Add vendor to favorites
 * @access  Private
 */
router.post('/', verifyToken, addFavorite);

/**
 * @route   DELETE /api/favorites/:vendorId
 * @desc    Remove vendor from favorites
 * @access  Private
 */
router.delete('/:vendorId', verifyToken, removeFavorite);

module.exports = router; 