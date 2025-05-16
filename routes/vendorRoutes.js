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
  updateVendorStatus,
  getVendorProfile
} = require('../controllers/vendorController');

// Protected routes - require authentication
router.get('/profile', verifyToken, getVendorProfile);
router.post('/', verifyToken, createVendor);

// Admin routes
router.get('/admin/vendors', verifyToken, getAdminVendors);
router.put('/admin/vendor-status/:id', verifyToken, updateVendorStatus);

// User-specific routes
router.get('/user/:userId', verifyToken, getVendorByUserId);

// Public routes
router.get('/', getVendors);
router.get('/:id', getVendorById);
router.put('/:id', verifyToken, updateVendor);
router.delete('/:id', verifyToken, deleteVendor);

module.exports = router;
