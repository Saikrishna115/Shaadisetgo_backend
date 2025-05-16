const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { 
  createBooking, 
  getBookings, 
  getBookingById, 
  updateBooking,
  getCustomerBookings,
  getVendorBookings
} = require('../controllers/bookingController');

/**
 * @route   GET /api/bookings/customer
 * @desc    Get customer's bookings
 * @access  Private
 */
router.get('/customer', verifyToken, getCustomerBookings);

/**
 * @route   GET /api/bookings/vendor
 * @desc    Get vendor's bookings
 * @access  Private
 */
router.get('/vendor', verifyToken, getVendorBookings);

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings
 * @access  Private
 */
router.get('/', verifyToken, getBookings);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/:id', verifyToken, getBookingById);

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private
 */
router.post('/', verifyToken, createBooking);

/**
 * @route   PUT /api/bookings/:id
 * @desc    Update booking status
 * @access  Private
 */
router.put('/:id', verifyToken, updateBooking);

module.exports = router;
