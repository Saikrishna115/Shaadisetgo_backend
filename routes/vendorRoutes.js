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
  getVendorProfile,
  getVendorAvailability,
  updateVendorAvailability,
  updateVendorSettings
} = require('../controllers/vendorController');

// Protected routes - require authentication
router.get('/profile', verifyToken, getVendorProfile);
router.post('/', verifyToken, createVendor);

// Admin routes
router.get('/admin/vendors', verifyToken, getAdminVendors);
router.put('/admin/:id/status', verifyToken, updateVendorStatus);

// User-specific routes
router.get('/user/:userId', verifyToken, getVendorByUserId);

// Public routes
router.get('/', getVendors);
router.get('/:id', getVendorById);
router.put('/:id', verifyToken, updateVendor);
router.delete('/:id', verifyToken, deleteVendor);

// Availability and settings management routes
router.get('/availability', verifyToken, getVendorAvailability);
router.post('/availability', verifyToken, updateVendorAvailability);
router.put('/settings', verifyToken, updateVendorSettings);

module.exports = router;
