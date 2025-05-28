const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const bookingController = require('../controllers/bookingController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Multi-step booking process routes
router.post('/', bookingController.createBooking);
router.patch('/:id', bookingController.updateBooking);

// Booking management routes
router.get('/user', bookingController.getCustomerBookings);
router.get('/vendor/:vendorId', restrictTo(['vendor', 'admin']), bookingController.getVendorBookings);
router.get('/:id', bookingController.getBookingById);
router.patch('/:id/cancel', bookingController.cancelBooking);
router.patch('/:id/status', restrictTo(['vendor']), bookingController.updateVendorStatus);

module.exports = router;