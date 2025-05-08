const express = require('express');
const router = express.Router();
const { createBooking, getBookings, getBookingById, updateBooking } = require('../controllers/bookingController');  // Ensure correct import

// Public routes
router.get('/', getBookings);  // Ensure getBookings is a valid function
router.get('/:id', getBookingById);  // Ensure getBookingById is a valid function

// Protected routes
router.post('/', createBooking);  // Ensure createBooking is a valid function
router.put('/:id', updateBooking);  // Ensure updateBooking is a valid function

module.exports = router;
