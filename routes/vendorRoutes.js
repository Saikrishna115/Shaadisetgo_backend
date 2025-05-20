const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  createVendor,
  getVendors,
  getVendorById,
  getVendorByUserId,
  updateVendor,
  deleteVendor,
  getAdminVendors,
  updateVendorStatus,
  getVendorProfile,
  getVendorAvailability,
  updateVendorAvailability,
  updateVendorSettings
} = require('../controllers/vendorController');
const { updateBooking } = require('../controllers/bookingController');
const Vendor = require('../models/Vendor');
const { authenticateToken: protect, authorize } = require('../middleware/auth');
const Booking = require('../models/Booking');

// Protected routes - require authentication
router.get('/profile', protect, authorize('vendor'), async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user.userId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }
    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor profile',
      error: error.message
    });
  }
});

router.put('/profile', protect, authorize('vendor'), async (req, res) => {
  try {
    const allowedUpdates = [
      'businessName',
      'serviceCategory',
      'description',
      'location',
      'priceRange',
      'contactNumber',
      'email',
      'images',
      'availability',
      'services'
    ];

    const updates = Object.keys(req.body)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    const vendor = await Vendor.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating vendor profile',
      error: error.message
    });
  }
});

// Vendor booking actions
router.put('/bookings/:id/accept', protect, authorize('vendor'), async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user.userId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    // Update booking status to confirmed
    req.body.status = 'confirmed';
    await updateBooking(req, res);
  } catch (error) {
    console.error('Error accepting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting booking',
      error: error.message
    });
  }
});

router.put('/bookings/:id/reject', protect, authorize('vendor'), async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user.userId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    // Update booking status to rejected
    req.body.status = 'rejected';
    await updateBooking(req, res);
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting booking',
      error: error.message
    });
  }
});

router.put('/bookings/:id/complete', protect, authorize('vendor'), async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user.userId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    // Update booking status to completed
    req.body.status = 'completed';
    await updateBooking(req, res);
  } catch (error) {
    console.error('Error completing booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing booking',
      error: error.message
    });
  }
});

// Get detailed customer information for a booking
router.get('/bookings/:id/customer', protect, authorize('vendor'), async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user.userId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'fullName email phone address preferences')
      .populate('vendorId', 'businessName serviceCategory');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify that the booking belongs to this vendor
    if (booking.vendorId._id.toString() !== vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      data: {
        booking,
        customer: booking.customerId
      }
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer details',
      error: error.message
    });
  }
});

router.get('/stats', protect, authorize('vendor'), async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user.userId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    // Get booking statistics
    const stats = await Booking.aggregate([
      { $match: { vendorId: vendor._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $in: ['$status', ['confirmed', 'completed']] },
                '$budget',
                0
              ]
            }
          }
        }
      }
    ]);

    // Calculate total bookings and revenue
    const totalBookings = stats.reduce((sum, stat) => sum + stat.count, 0);
    const totalRevenue = stats.reduce((sum, stat) => sum + stat.totalRevenue, 0);

    // Get recent bookings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentBookings = await Booking.countDocuments({
      vendorId: vendor._id,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Calculate average rating
    const ratings = await Booking.aggregate([
      { $match: { vendorId: vendor._id, rating: { $exists: true } } },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalBookings,
        totalRevenue,
        recentBookings,
        averageRating: ratings[0]?.averageRating || 0,
        bookingsByStatus: stats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor statistics',
      error: error.message
    });
  }
});

// Admin routes
router.get('/admin/vendors', verifyToken, getAdminVendors);
router.put('/admin/:id/status', verifyToken, updateVendorStatus);

// User-specific routes
router.get('/user/:userId', verifyToken, getVendorByUserId);

// Public routes
router.get('/', getVendors);
router.get('/:id', getVendorById);
router.put('/:id', verifyToken, updateVendor);
router.delete('/:id', verifyToken, deleteVendor);

// Availability and settings management routes
router.get('/availability', verifyToken, getVendorAvailability);
router.post('/availability', verifyToken, updateVendorAvailability);
router.put('/settings', verifyToken, updateVendorSettings);

module.exports = router;
