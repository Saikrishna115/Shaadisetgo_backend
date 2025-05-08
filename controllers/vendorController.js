const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

const {
  createVendor,
  getVendors,
  getVendorById,
  getVendorByUserId,
  updateVendor
} = require('../controllers/vendorController'); // ✅ Import correctly

// Routes
router.post('/', auth, createVendor);
router.get('/', getVendors); 
router.get('/:id', getVendorById);
router.get('/user/:userId', getVendorByUserId);
router.put('/:id', auth, updateVendor);

module.exports = router;
