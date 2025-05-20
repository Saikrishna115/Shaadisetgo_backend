const express = require('express');
const router = express.Router();
const { getVendorById } = require('../controllers/vendorController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/vendors/:id
 * @desc    Get vendor by ID
 * @access  Public
 */
router.get('/:id', getVendorById);

module.exports = router;