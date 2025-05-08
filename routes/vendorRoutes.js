const express = require('express');
const { 
  createVendor, 
  getVendors, 
  getVendor, 
  updateVendor, 
  deleteVendor,
  getAdminVendors, 
  updateVendorStatus 
} = require('../controllers/vendorController');
const auth = require('../middleware/authMiddleware');
const router = express.Router();


// Public routes
router.get('/', getVendors);
router.get('/:id', getVendor);

// Protected vendor routes
router.post('/', auth, createVendor);
router.put('/:id', auth, updateVendor);
router.delete('/:id', auth, deleteVendor);

// Admin routes
router.get('/admin/vendors', auth, getAdminVendors);
router.put('/admin/vendor-status/:id', auth, updateVendorStatus);

module.exports = router;
