const express = require('express');
const router = express.Router();
const { createBooking, getBookings, getBookingById, updateBooking } = require('../controllers/bookingController');

// Public routes
router.get('/', getBookings);  // Get all bookings
router.get('/:id', getBookingById);  // Get booking by ID

// Protected routes (you might need authentication middleware here)
router.post('/', createBooking);  // Create a new booking
router.put('/:id', updateBooking);  // Update booking by ID

module.exports = router;
