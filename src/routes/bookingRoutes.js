const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { 
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  getCustomerBookings,
  getVendorBookings,
  cancelBooking,
  getBookingStats,
  updateBookingStatus,
  updateVendorStatus
} = require('../controllers/bookingController');
const { protect, restrictTo } = require('../middleware/auth');

// Admin routes
router.get('/', protect, restrictTo('admin'), getBookings);

// Vendor routes
router.get('/vendor', protect, restrictTo('vendor'), getVendorBookings);
router.get('/stats', protect, restrictTo('vendor'), getBookingStats);
router.put('/:id/status', protect, restrictTo('vendor'), updateBookingStatus);
router.put('/:id/vendor-status', protect, restrictTo('vendor'), updateVendorStatus);

// Customer routes
router.post('/', protect, restrictTo('customer'), createBooking);
router.get('/customer', protect, restrictTo('customer'), getCustomerBookings);

// Parameterized routes (must come after specific routes)
router.get('/:id', protect, getBookingById);
router.put('/:id', protect, updateBooking);
router.delete('/:id', protect, restrictTo('customer'), cancelBooking);

module.exports = router;