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
