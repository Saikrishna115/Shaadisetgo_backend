const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const bookingController = require('../controllers/bookingController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Multi-step booking process routes
router.post('/initialize', bookingController.initializeBooking);
router.patch('/:bookingId/event-details', bookingController.updateEventDetails);
router.patch('/:bookingId/package', bookingController.selectPackage);
router.post('/:bookingId/payment', bookingController.processPayment);

// Booking management routes
router.get('/user', bookingController.getUserBookings);
router.get('/vendor/:vendorId', restrictTo(['vendor', 'admin']), bookingController.getVendorBookings);
router.get('/:bookingId', bookingController.getBooking);
router.post('/:bookingId/messages', bookingController.addMessage);
router.patch('/:bookingId/cancel', bookingController.cancelBooking);

module.exports = router;