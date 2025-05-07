const Booking = require('../models/Booking');

const createBooking = async (req, res) => {
  try {
    const booking = await Booking.create({ ...req.body, customerId: req.user.id });
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error creating booking', error });
  }
};

const getBookingsByCustomer = async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.params.id }).populate('vendorId');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error });
  }
};

const getBookingsByVendor = async (req, res) => {
  try {
    const bookings = await Booking.find({ vendorId: req.params.id }).populate('customerId');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error });
  }
};

const getBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    let bookings;
    
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
