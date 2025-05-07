const express = require('express');
const router = express.Router();
const { createBooking, getBookingsByCustomer, getBookingsByVendor, getBookings } = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getBookings);
router.post('/', verifyToken, createBooking);
router.get('/customer/:id', verifyToken, getBookingsByCustomer);
router.get('/vendor/:id', verifyToken, getBookingsByVendor);

module.exports = router;
