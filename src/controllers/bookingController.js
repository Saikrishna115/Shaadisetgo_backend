// controllers/bookingController.js
const Booking = require('../models/Booking');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail, sendBookingConfirmationEmail } = require('../utils/email');

// Create a booking
const calculateBookingStats = async (vendorId) => {
  try {
    const totalBookings = await Booking.countDocuments({ vendorId });
    const acceptedBookings = await Booking.countDocuments({ vendorId, status: 'confirmed' });
    const rejectedBookings = await Booking.countDocuments({ vendorId, status: 'rejected' });
    const pendingBookings = await Booking.countDocuments({ vendorId, status: 'pending' });

    return {
      total: totalBookings,
      accepted: acceptedBookings,
      rejected: rejectedBookings,
      pending: pendingBookings,
      acceptanceRate: totalBookings > 0 ? (acceptedBookings / totalBookings) * 100 : 0,
      rejectionRate: totalBookings > 0 ? (rejectedBookings / totalBookings) * 100 : 0
    };
  } catch (error) {
    throw error;
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify vendor is associated with this booking
    const vendor = await Vendor.findOne({ userId: req.user.userId });
    if (!vendor) {
      return res.status(403).json({ success: false, message: 'Vendor profile not found' });
    }
    if (!vendor._id.equals(booking.vendorId)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this booking' });
    }

    booking.status = req.body.status;
    await booking.save();

    // Notify customer about status change
    const customer = await User.findById(booking.customerId);
    if (customer) {
      const notification = {
        userId: customer._id,
        message: `Your booking with ${vendor.businessName} has been ${req.body.status}`,
        type: 'booking-status',
        bookingId: booking._id,
        status: req.body.status
      };
      await Notification.create(notification);

      // Send email notification
      const emailContent = `Dear ${customer.fullName},

Your booking with ${vendor.businessName} has been ${req.body.status}.

Booking Details:
Service: ${vendor.serviceCategory}
Date: ${booking.bookingDate}

Thank you for using our services.

Best regards,
ShaadiSetGo Team`;

      await sendEmail(customer.email, 'Booking Status Update', emailContent);
    }

    const stats = await calculateBookingStats(booking.vendorId);

    res.status(200).json({ 
      success: true, 
      data: booking,
      stats: stats,
      message: 'Booking status updated successfully' 
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
};

const createBooking = async (req, res) => {
  try {
    const { vendorId, eventDate, eventType, guestCount, venue, startTime, endTime, additionalServices, specialRequests, packageId, addons } = req.body;

    // Get customer details
    const customer = await User.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get vendor details and verify availability
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Verify date availability
    const isDateBlocked = vendor.blockedDates?.some(date => 
      date.toISOString().split('T')[0] === new Date(eventDate).toISOString().split('T')[0]
    );

    if (isDateBlocked) {
      return res.status(400).json({ error: 'Selected date is not available' });
    }

    // Calculate package and addons cost
    let totalCost = 0;
    let selectedPackage = null;
    let selectedAddons = [];

    if (packageId) {
      selectedPackage = vendor.packages.id(packageId);
      if (!selectedPackage) {
        return res.status(404).json({ error: 'Package not found' });
      }
      totalCost += selectedPackage.price;

      if (addons?.length > 0) {
        addons.forEach(addonId => {
          const addon = vendor.addons.id(addonId);
          if (addon) {
            totalCost += addon.price;
            selectedAddons.push(addon);
          }
        });
      }
    }

    // Create booking with all required information
    const bookingData = {
      customerId: customer._id,
      customerName: customer.fullName,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      vendorId: vendor._id,
      vendorName: vendor.businessName,
      vendorService: vendor.serviceCategory,
      eventDetails: {
        date: eventDate,
        type: eventType,
        guestCount,
        venue,
        startTime,
        endTime,
        additionalServices,
        specialRequests
      },
      package: selectedPackage ? {
        details: selectedPackage,
        addons: selectedAddons,
        totalCost
      } : null,
      status: 'pending',
      lastUpdatedBy: 'customer'
    };

    const booking = await Booking.create(bookingData);
    
    // Populate the booking with customer and vendor details for the response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('customerId', 'fullName email phone')
      .populate('vendorId', 'businessName serviceCategory');

    // Send confirmation email
    await sendBookingConfirmationEmail(customer.email, populatedBooking);

    res.status(201).json(populatedBooking);
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ error: 'Failed to create booking', details: err.message });
  }
};

// Get all bookings
const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('customerId', 'fullName email phone')
      .populate('vendorId', 'businessName serviceCategory location priceRange')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching all bookings:', err);
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
      .populate('vendorId', 'businessName serviceCategory location priceRange contactInfo profileImage')
      .populate({
        path: 'messages.sender',
        select: 'fullName role profileImage'
      });

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

    // Add additional booking analytics if vendor is viewing
    if (await Vendor.exists({ userId: req.user._id, _id: booking.vendorId._id })) {
      const stats = await calculateBookingStats(booking.vendorId);
      return res.json({
        booking,
        stats
      });
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
    const { 
      status, 
      vendorResponse, 
      messageType,
      paymentStatus,
      paymentAmount,
      completionNotes,
      cancellationReason,
      rating,
      review
    } = req.body;
    
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
      updateData.lastUpdatedBy = vendor ? 'vendor' : 'customer';
      
      if (status === 'cancelled') {
        updateData.cancellationReason = cancellationReason;
        updateData.cancellationDate = new Date();
      } else if (status === 'completed') {
        updateData.completionNotes = completionNotes;
        // Add completion date when marking as completed
        updateData.completionDate = new Date();
      } else if (status === 'confirmed') {
        // Add confirmation date when vendor accepts booking
        updateData.confirmationDate = new Date();
      } else if (status === 'rejected') {
        // Add rejection date and reason when vendor rejects booking
        updateData.rejectionDate = new Date();
        updateData.rejectionReason = vendorResponse;
      }
    }
    
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }
    
    if (paymentAmount) {
      updateData.paymentAmount = paymentAmount;
    }
    
    // Handle vendor response
    if (vendorResponse) {
      // If this is a new message (not status change)
      if (messageType === 'message' && booking.status === 'confirmed') {
        // Add to message history
        const messageHistory = booking.messageHistory || [];
        messageHistory.push({
          message: vendorResponse,
          sender: vendor ? 'vendor' : 'customer',
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
    const { cancellationReason } = req.body;
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
    booking.cancellationReason = cancellationReason;
    booking.cancellationDate = new Date();
    booking.lastUpdatedBy = 'customer';
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

// Get booking statistics for vendor
const getBookingStats = async (req, res) => {
  try {
    // First find the vendor document for the current user
    const vendor = await Vendor.findOne({ userId: req.user._id });
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
    console.error('Error fetching booking stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching booking statistics',
      error: error.message 
    });
  }
};

const updateVendorStatus = async (req, res) => {
  try {
    console.log('Attempting to update booking status:', { bookingId: req.params.id, userId: req.user.userId });
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      console.error('Booking not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify vendor is associated with this booking
    const vendor = await Vendor.findOne({ userId: req.user.userId });
    if (!vendor) {
      console.error('Vendor not found for user:', req.user.userId);
      return res.status(403).json({ success: false, message: 'Vendor profile not found' });
    }
    if (!vendor._id.equals(booking.vendorId)) {
      console.error('Vendor not authorized for booking:', { vendorId: vendor._id, bookingVendorId: booking.vendorId });
      return res.status(403).json({ success: false, message: 'Not authorized for this booking' });
    }

    // Validate status
    if (!['confirmed', 'rejected', 'completed'].includes(req.body.status)) {
      console.error('Invalid status:', req.body.status);
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    booking.status = req.body.status;
    if (req.body.status === 'rejected') {
      booking.vendorResponse = req.body.vendorResponse || 'Booking rejected by vendor';
    }

    try {
      await booking.save();
      console.log('Booking status updated successfully:', { bookingId: booking._id, newStatus: booking.status });
      res.json({
        success: true,
        message: 'Booking status updated successfully',
        data: booking
      });
    } catch (saveError) {
      console.error('Error saving booking:', { bookingId: booking._id, error: saveError });
      res.status(500).json({
        success: false,
        message: 'Failed to save booking updates',
        error: saveError.message
      });
    }

  } catch (error) {
    console.error('Error updating vendor status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  getCustomerBookings,
  getVendorBookings,
  cancelBooking,
  getBookingStats,
  updateBookingStatus,
  updateVendorStatus
};
