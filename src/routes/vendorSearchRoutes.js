const express = require('express');
const vendorSearchController = require('../controllers/vendorSearchController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/search', vendorSearchController.searchVendors);
router.get('/trending', vendorSearchController.getTrendingVendors);

// Protected routes
router.use(protect);
router.get('/suggestions', vendorSearchController.getVendorSuggestions);

module.exports = router;