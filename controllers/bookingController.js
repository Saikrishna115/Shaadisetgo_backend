// controllers/bookingController.js
const Booking = require('../models/Booking');
const Vendor = require('../models/Vendor');

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
      .populate('vendorId', 'businessName serviceType')
      .sort({ createdAt: -1 });

    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      vendorName: booking.vendorId.businessName,
      service: booking.vendorId.serviceType,
      eventDate: booking.bookingDate,
      status: booking.status,
      amount: booking.amount,
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
    // First find the vendor document for the current user
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }

    // Find all bookings for this vendor
    const bookings = await Booking.find({ vendorId: vendor._id })
      .populate('customerId', 'fullName email phone')
      .sort({ createdAt: -1 });

    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      customerName: booking.customerId.fullName,
      customerEmail: booking.customerId.email,
      customerPhone: booking.customerId.phone,
      eventDate: booking.bookingDate,
      status: booking.status,
      message: booking.message,
      createdAt: booking.createdAt
    }));

    res.json(formattedBookings);
  } catch (err) {
    console.error('Error fetching vendor bookings:', err);
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
