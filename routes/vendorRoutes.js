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
} = require('../controllers/vendorController');  // Ensure correct import

// Public routes
router.get('/', getVendors); // Ensure getVendors function exists and is imported correctly
router.get('/:id', getVendorById);  // Ensure getVendorById function exists and is imported correctly
router.get('/user/:userId', getVendorByUserId); // Ensure getVendorByUserId function exists and is imported correctly

// Protected vendor routes
router.post('/', verifyToken, createVendor);  // Ensure createVendor is correctly imported
router.put('/:id', verifyToken, updateVendor);
router.delete('/:id', verifyToken, deleteVendor);

// Admin routes
router.get('/admin/vendors', verifyToken, getAdminVendors);  // Ensure getAdminVendors exists and is imported
router.put('/admin/vendor-status/:id', verifyToken, updateVendorStatus); // Ensure updateVendorStatus exists

module.exports = router;
