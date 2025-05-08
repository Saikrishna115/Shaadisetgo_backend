const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

const {
  createVendor,
  getVendors,
  getVendorById,
  getVendorByUserId,
  updateVendor
} = require('../controllers/vendorController'); // ✅ Correctly imported

// Routes
router.post('/', auth, createVendor); // Only authenticated users can create vendors
router.get('/', getVendors); // Public route to get all vendors
router.get('/:id', getVendorById); // Public route to get vendor by ID
router.get('/user/:userId', getVendorByUserId); // Public route to get vendor by user ID
router.put('/:id', auth, updateVendor); // Only authenticated users can update vendor

module.exports = router;
