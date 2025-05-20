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
const { authenticateToken: protect, authorize } = require('../middleware/auth');

// Admin routes
router.get('/', protect, authorize('admin'), getBookings);

// Public routes
router.get('/stats', protect, authorize('vendor'), getBookingStats);

// Customer routes
router.post('/', protect, authorize('customer'), createBooking);
router.get('/customer', protect, authorize('customer'), getCustomerBookings);

// Vendor routes
router.get('/vendor', protect, authorize('vendor'), getVendorBookings);

// Parameterized routes (must come after specific routes)
router.get('/:id', protect, getBookingById);
router.put('/:id', protect, updateBooking);
router.delete('/:id', protect, authorize('customer'), cancelBooking);

module.exports = router; 