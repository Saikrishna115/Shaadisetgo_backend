const express = require('express');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Booking = require('../models/Booking');

const router = express.Router();

// Get admin dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const users = await User.countDocuments();
    const vendors = await Vendor.countDocuments();
    const bookings = await Booking.countDocuments();
    res.json({ users, vendors, bookings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

module.exports = router;
