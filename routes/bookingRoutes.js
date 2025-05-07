const express = require('express');
const { createBooking, getCustomerBookings, getVendorBookings } = require('../controllers/bookingController');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', auth, createBooking);
router.get('/customer/:id', auth, getCustomerBookings);
router.get('/vendor/:id', auth, getVendorBookings);

module.exports = router;
