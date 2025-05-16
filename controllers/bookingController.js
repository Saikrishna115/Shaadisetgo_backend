// controllers/bookingController.js
const Booking = require('../models/Booking');
const Vendor = require('../models/Vendor');
const User = require('../models/User');  // Add User model

// Create a booking
const createBooking = async (req, res) => {
  try {
    const booking = await Booking.create(req.body);
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

// Get all bookings
const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

// Get customer's bookings
const getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.user.id })
      .populate('vendorId', 'businessName serviceCategory')
      .sort({ createdAt: -1 });

    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      vendorName: booking.vendorId.businessName,
      service: booking.vendorId.serviceCategory,
      eventDate: booking.bookingDate,
      status: booking.status,
      message: booking.message,
      createdAt: booking.createdAt
    }));

    res.json(formattedBookings);
  } catch (err) {
    console.error('Error fetching customer bookings:', err);
    res.status(500).json({ error: 'Failed to fetch customer bookings' });
  }
};

// Get vendor's bookings
const getVendorBookings = async (req, res) => {
  try {
    console.log('Finding vendor for user:', req.user._id);
    // First find the vendor document for the current user
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      console.error('No vendor found for user:', req.user._id);
      return res.status(404).json({ error: 'Vendor profile not found' });
    }

    console.log('Found vendor:', vendor._id);
    // Find all bookings for this vendor
    const bookings = await Booking.find({ vendorId: vendor._id })
      .populate('customerId', 'fullName email phone')
      .sort({ createdAt: -1 });

    console.log('Found bookings:', bookings.length);
    const formattedBookings = bookings.map(booking => {
      const customer = booking.customerId || {};
      return {
        _id: booking._id,
        customerName: customer.fullName || 'N/A',
        customerEmail: customer.email || 'N/A',
        customerPhone: customer.phone || 'N/A',
        eventDate: booking.bookingDate,
        status: booking.status,
        message: booking.message,
        createdAt: booking.createdAt
      };
    });

    console.log('Formatted bookings:', formattedBookings.length);
    res.json(formattedBookings);
  } catch (err) {
    console.error('Error fetching vendor bookings:', {
      error: err.message,
      stack: err.stack,
      userId: req.user._id
    });
    res.status(500).json({ error: 'Failed to fetch vendor bookings' });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
};

// Update booking
const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  getCustomerBookings,
  getVendorBookings
};
