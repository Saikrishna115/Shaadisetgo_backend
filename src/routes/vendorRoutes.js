const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
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
const { updateBooking } = require('../controllers/bookingController');

// Public routes
router.get('/', getVendors);
router.get('/:id', getVendorById);

// Protected vendor routes
router.post('/', protect, createVendor);
router.get('/user/:userId', protect, getVendorByUserId);
router.put('/:id', protect, restrictTo('vendor'), updateVendor);
router.delete('/:id', protect, restrictTo('vendor', 'admin'), deleteVendor);

// Admin only routes
router.get('/admin/vendors', protect, restrictTo('admin'), getAdminVendors);

// Vendor status and availability
router.put('/:id/vendor-status', protect, restrictTo('vendor'), updateVendorStatus);
router.get('/:id/availability', protect, getVendorAvailability);
router.put('/:id/availability', protect, restrictTo('vendor'), updateVendorAvailability);

// Vendor profile and settings
router.get('/profile/:id', protect, getVendorProfile);
router.put('/settings', protect, restrictTo('vendor'), updateVendorSettings);

module.exports = router;
