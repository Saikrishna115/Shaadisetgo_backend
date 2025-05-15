const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { createBooking, getBookings, getBookingById, updateBooking } = require('../controllers/bookingController');

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
 * @desc    Update booking by ID
 * @access  Private
 */
router.put('/:id', verifyToken, updateBooking);

module.exports = router;
