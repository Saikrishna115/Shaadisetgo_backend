// controllers/bookingController.js
const Booking = require('../models/Booking');
const Vendor = require('../models/Vendor');
const User = require('../models/User');

// Create a booking
const createBooking = async (req, res) => {
  try {
    // Get customer details
    const customer = await User.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get vendor details
    const vendor = await Vendor.findById(req.body.vendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Create booking with all required information
    const bookingData = {
      ...req.body,
      customerId: customer._id,
      customerName: customer.fullName,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      vendorName: vendor.businessName,
      vendorService: vendor.serviceCategory,
      status: 'pending'
    };

    const booking = await Booking.create(bookingData);
    
    // Populate the booking with customer and vendor details for the response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('customerId', 'fullName email phone')
      .populate('vendorId', 'businessName serviceCategory');

    res.status(201).json(populatedBooking);
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ error: 'Failed to create booking', details: err.message });
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
      .populate('vendorId', 'businessName serviceCategory location priceRange')
      .sort({ createdAt: -1 });

    res.json(bookings);
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

    res.json(bookings);
  } catch (err) {
    console.error('Error fetching vendor bookings:', err);
    res.status(500).json({ error: 'Failed to fetch vendor bookings' });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'fullName email phone')
      .populate('vendorId', 'businessName serviceCategory location priceRange');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if the user has permission to view this booking
    if (
      req.user.role !== 'admin' &&
      booking.customerId._id.toString() !== req.user.id &&
      !(await Vendor.exists({ userId: req.user._id, _id: booking.vendorId._id }))
    ) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (err) {
    console.error('Error fetching booking:', err);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
};

// Update booking status
const updateBooking = async (req, res) => {
  try {
    const { status, vendorResponse, messageType } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if the user has permission to update this booking
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (
      req.user.role !== 'admin' &&
      booking.customerId.toString() !== req.user.id &&
      (!vendor || vendor._id.toString() !== booking.vendorId.toString())
    ) {
      return res.status(403).json({ error: 'Not authorized to update this booking' });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['confirmed', 'rejected', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      rejected: [],
      cancelled: [],
      completed: []
    };

    if (status && !validTransitions[booking.status].includes(status)) {
      return res.status(400).json({ 
        error: `Cannot transition from ${booking.status} to ${status}` 
      });
    }

    // Update the booking
    const updateData = {};
    if (status) {
      updateData.status = status;
    }
    
    // Handle vendor response
    if (vendorResponse) {
      // If this is a new message (not status change)
      if (messageType === 'message' && booking.status === 'confirmed') {
        // Add to message history
        const messageHistory = booking.messageHistory || [];
        messageHistory.push({
          message: vendorResponse,
          sender: 'vendor',
          timestamp: new Date()
        });
        updateData.messageHistory = messageHistory;
      } else {
        // This is a response to booking request
        updateData.vendorResponse = vendorResponse;
        updateData.vendorResponseDate = new Date();
      }
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('customerId', 'fullName email phone')
     .populate('vendorId', 'businessName serviceCategory location priceRange');

    res.json(updatedBooking);
  } catch (err) {
    console.error('Error updating booking:', err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Only allow cancellation if the booking is pending or confirmed
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ 
        error: `Cannot cancel booking with status: ${booking.status}` 
      });
    }

    // Check if the user has permission to cancel this booking
    if (
      req.user.role !== 'admin' &&
      booking.customerId.toString() !== req.user.id
    ) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

module.exports = {
  createBooking,
  getBookings: getCustomerBookings, // Default to customer bookings for backward compatibility
  getBookingById,
  updateBooking,
  getCustomerBookings,
  getVendorBookings,
  cancelBooking
};
