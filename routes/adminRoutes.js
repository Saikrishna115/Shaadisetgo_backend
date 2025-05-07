const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');

// Import controllers
const {
  getUsers,
  updateUserStatus,
  getVendors,
  updateVendorStatus,
  getBookings,
  updateBookingStatus
} = require('../controllers/adminController');

// Protect all routes with admin middleware
router.use(adminMiddleware);

// User management routes
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);

// Vendor management routes
router.get('/vendors', getVendors);
router.put('/vendors/:id/status', updateVendorStatus);

// Booking management routes
router.get('/bookings', getBookings);
router.put('/bookings/:id/status', updateBookingStatus);

module.exports = router;