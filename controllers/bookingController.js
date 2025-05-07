const Booking = require('../models/Booking');

// Create a new booking
const createBooking = async (req, res) => {
  try {
    // Creating a new booking with the customerId being the logged-in user's ID
    const booking = await Booking.create({ ...req.body, customerId: req.user.id });
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error creating booking', error });
  }
};

// Get all bookings by a specific customer
const getBookingsByCustomer = async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.params.id }).populate('vendorId');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error });
  }
};

// Get all bookings by a specific vendor
const getBookingsByVendor = async (req, res) => {
  try {
    const bookings = await Booking.find({ vendorId: req.params.id }).populate('customerId');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error });
  }
};

// Get all bookings for the logged-in user (either customer or vendor)
const getBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    let bookings;

    // If the user is a vendor, fetch bookings for that vendor, else fetch bookings for the customer
    if (req.user.role === 'vendor') {
      bookings = await Booking.find({ vendorId: userId }).populate('customerId');
    } else {
      bookings = await Booking.find({ customerId: userId }).populate('vendorId');
    }

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error });
  }
};

module.exports = { createBooking, getBookingsByCustomer, getBookingsByVendor, getBookings };
