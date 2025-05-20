const express = require('express');
const router = express.Router();
const { 
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  getCustomerBookings,
  getVendorBookings,
  cancelBooking,
  getBookingStats
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/stats', protect, authorize('vendor'), getBookingStats);

// Customer routes
router.post('/', protect, authorize('customer'), createBooking);
router.get('/customer', protect, authorize('customer'), getCustomerBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id', protect, updateBooking);
router.delete('/:id', protect, authorize('customer'), cancelBooking);

// Vendor routes
router.get('/vendor', protect, authorize('vendor'), getVendorBookings);

// Admin routes
router.get('/', protect, authorize('admin'), getBookings);

module.exports = router; 