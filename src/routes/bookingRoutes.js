const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { 
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  getCustomerBookings,
  getVendorBookings,
  cancelBooking,
  getBookingStats,
  updateBookingStatus
} = require('../controllers/bookingController');
const { authenticateToken: protect, restrictTo } = require('../middleware/auth');

// Admin routes
router.get('/', protect, restrictTo('admin'), getBookings);

// Vendor routes
router.get('/vendor', protect, restrictTo('vendor'), getVendorBookings);
router.get('/stats', protect, restrictTo('vendor'), getBookingStats);
router.put('/:id/status', protect, restrictTo('customer'), updateBookingStatus);

// Customer routes
router.put('/:id/vendor-status', protect, restrictTo('vendor'), async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, vendorResponse: req.body.vendorResponse },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
});

router.post('/', protect, restrictTo('customer'), createBooking);
router.get('/customer', protect, restrictTo('customer'), getCustomerBookings);

// Parameterized routes (must come after specific routes)
router.get('/:id', protect, getBookingById);
router.put('/:id', protect, updateBooking);
router.delete('/:id', protect, restrictTo('customer'), cancelBooking);

module.exports = router;