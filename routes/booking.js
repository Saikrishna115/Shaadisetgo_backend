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

/**
 * @route   GET /api/bookings/customer
 * @desc    Get customer's bookings
 * @access  Private
 */
router.get('/customer', protect, authorize('customer'), getCustomerBookings);

/**
 * @route   GET /api/bookings/vendor
 * @desc    Get vendor's bookings
 * @access  Private
 */
router.get('/vendor', protect, authorize('vendor'), getVendorBookings);

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings
 * @access  Private
 */
router.get('/', protect, getBookings);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/:id', protect, getBookingById);

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private
 */
router.post('/', protect, authorize('customer'), createBooking);

/**
 * @route   PUT /api/bookings/:id
 * @desc    Update booking status
 * @access  Private
 */
router.put('/:id', protect, updateBooking);

/**
 * @route   GET /api/bookings/stats
 * @desc    Get booking stats
 * @access  Private
 */
router.get('/stats', protect, authorize('vendor'), getBookingStats);

/**
 * @route   POST /api/bookings/:id/cancel
 * @desc    Cancel a booking
 * @access  Private
 */
router.post('/:id/cancel', protect, authorize('customer'), cancelBooking);

module.exports = router;
