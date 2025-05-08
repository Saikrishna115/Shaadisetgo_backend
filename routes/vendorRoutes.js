const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  createVendor,
  getVendors,
  getVendorById,
  getVendorByUserId,
  updateVendor,
  deleteVendor,
  getAdminVendors,
  updateVendorStatus
} = require('../controllers/vendorController');  // Correct import

// Public routes
router.get('/', getVendors); 
router.get('/:id', getVendorById); 
router.get('/user/:userId', getVendorByUserId);

// Protected vendor routes
router.post('/', verifyToken, createVendor);  // Ensure createVendor is imported as a function
router.put('/:id', verifyToken, updateVendor);
router.delete('/:id', verifyToken, deleteVendor);

// Admin routes
router.get('/admin/vendors', verifyToken, getAdminVendors); 
router.put('/admin/vendor-status/:id', verifyToken, updateVendorStatus);

module.exports = router;
