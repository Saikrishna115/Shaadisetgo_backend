const Vendor = require('../models/Vendor');
const User = require('../models/User');
const mongoose = require('mongoose');

// Create a new vendor
const createVendor = async (req, res) => {
  try {
    console.log('Creating vendor profile:', req.body);
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      console.error('User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const existingVendor = await Vendor.findOne({ userId });
    if (existingVendor) {
      console.log('Vendor profile already exists:', existingVendor._id);
      return res.status(400).json({
        success: false,
        message: 'Vendor profile already exists'
      });
    }

    // Validate required fields
    const requiredFields = ['businessName', 'ownerName', 'phone', 'location', 'serviceCategory'];
    const missingFields = requiredFields.filter(field => {
      if (field === 'location') {
        return !req.body.location || !req.body.location.city;
      }
      return !req.body[field];
    });

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        fields: missingFields
      });
    }

    // Create vendor profile with all required fields
    const vendorData = {
      ...req.body,
      userId,
      email: user.email,
      isActive: true,
      isVerified: false,
      rating: {
        average: 0,
        count: 0
      },
      priceRange: req.body.priceRange || {
        min: 0,
        max: 0
      }
    };

    console.log('Creating vendor with data:', vendorData);
    const vendor = await Vendor.create(vendorData);

    // Update user role to vendor if not already set
    if (user.role !== 'vendor') {
      await User.findByIdAndUpdate(userId, { role: 'vendor' });
    }

    console.log('Vendor profile created successfully:', vendor._id);
    res.status(201).json({
      success: true,
      message: 'Vendor profile created successfully',
      vendor
    });
  } catch (error) {
    console.error('Error creating vendor profile:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor data',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A vendor with this email already exists'
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Error creating vendor profile', 
      error: error.message 
    });
  }
};


// Get all vendors
const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.status(200).json(vendors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendors', error });
  }
};

// Get a specific vendor by vendor ID with complete details
const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate('userId', 'email')
      .populate({
        path: 'reviews',
        populate: {
          path: 'customerId',
          select: 'fullName'
        }
      });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get vendor's booking statistics
    const bookingStats = await Booking.aggregate([
      { $match: { vendorId: vendor._id } },
      { $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        completedBookings: { 
          $sum: { 
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] 
          }
        },
        cancelledBookings: { 
          $sum: { 
            $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] 
          }
        }
      }}
    ]);

    const vendorDetails = {
      ...vendor.toObject(),
      statistics: bookingStats[0] || {
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0
      }
    };

    res.status(200).json({
      success: true,
      data: vendorDetails
    });
  } catch (error) {
    console.error('Error fetching vendor details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor details',
      error: error.message
    });
  }
};

// Get a vendor by user ID
const getVendorByUserId = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.params.userId });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.status(200).json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendor', error });
  }
};

// Update vendor details
const updateVendor = async (req, res) => {
  try {
    // First check if the vendor exists
    const existingVendor = await Vendor.findById(req.params.id);
    if (!existingVendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Verify user has permission to update this vendor
    if (existingVendor.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this vendor profile' });
    }

    // Validate the update data
    const updateData = { ...req.body };
    delete updateData.userId; // Prevent userId from being modified
    delete updateData.isActive; // Prevent isActive from being modified directly

    // Update the vendor with validated data
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json(vendor);
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Invalid vendor data',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Failed to update vendor profile', error: error.message });
  }
};

// Delete vendor
const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.status(200).json({ message: 'Vendor deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting vendor', error });
  }
};

// Admin route to get all vendors
const getAdminVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.status(200).json(vendors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendors', error });
  }
};

// Update vendor status
const updateVendorStatus = async (req, res) => {
module.exports.updateVendorStatus = updateVendorStatus;
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.status(200).json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Error updating vendor status', error });
  }
};

// Get vendor profile for logged in user
const getVendorProfile = async (req, res) => {
  try {
    // Log the incoming request details
    console.log('getVendorProfile request:', {
      userId: req.user?._id,
      userRole: req.user?.role,
      headers: req.headers
    });

    // Validate user exists in request
    if (!req.user || !req.user._id) {
      console.error('No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    console.log('Fetching vendor profile for user:', req.user._id);
    const userId = req.user._id;

    try {
      // Log database connection status
      console.log('Database connection state:', mongoose.connection.readyState);
      
      const vendor = await Vendor.findOne({ userId });
      console.log('Vendor query result:', {
        found: !!vendor,
        vendorId: vendor?._id,
        userId: vendor?.userId
      });
      
      if (!vendor) {
        console.log('No vendor profile found, fetching user data for initial profile');
        // If no vendor profile exists, create one with basic information
        const user = await User.findById(userId);
        console.log('User query result:', {
          found: !!user,
          email: user?.email,
          role: user?.role,
          fullName: user?.fullName
        });

        if (!user) {
          console.error('User not found:', userId);
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        // Validate required user data
        if (!user.email) {
          console.error('User email missing:', userId);
          return res.status(400).json({
            success: false,
            message: 'User email is required'
          });
        }

        try {
          // Create initial vendor profile with all required fields
          const vendorData = {
            userId,
            businessName: user.fullName || 'My Business',
            ownerName: user.fullName || 'Business Owner',
            email: user.email,
            phone: user.phone || '0000000000', // Default phone number
            location: {
              city: 'Your City',
              state: 'Your State',
              address: '',
              pincode: ''
            },
            serviceCategory: 'Other',
            serviceDescription: 'New Vendor Profile',
            isActive: true,
            isVerified: false,
            priceRange: {
              min: 0,
              max: 0
            },
            rating: {
              average: 0,
              count: 0
            },
            experienceYears: 0,
            availableDates: [],
            tags: [],
            gallery: [],
            profileImage: '',
            reviews: []
          };

          console.log('Creating initial vendor profile with data:', vendorData);

          const newVendor = await Vendor.create(vendorData);

          // Update user role to vendor
          await User.findByIdAndUpdate(userId, { role: 'vendor' });

          console.log('Created initial vendor profile:', {
            vendorId: newVendor._id,
            userId: newVendor.userId,
            businessName: newVendor.businessName
          });

          return res.status(200).json({
            success: true,
            message: 'Initial vendor profile created',
            vendor: newVendor
          });
        } catch (createError) {
          console.error('Error creating vendor profile:', {
            error: createError.message,
            code: createError.code,
            stack: createError.stack,
            name: createError.name,
            errors: createError.errors
          });
          
          if (createError.name === 'ValidationError') {
            return res.status(400).json({
              success: false,
              message: 'Invalid vendor data',
              errors: Object.values(createError.errors).map(err => err.message)
            });
          }

          if (createError.code === 11000) {
            return res.status(400).json({
              success: false,
              message: 'A vendor with this email already exists'
            });
          }

          throw createError; // Re-throw for general error handling
        }
      }

      console.log('Found existing vendor profile:', {
        vendorId: vendor._id,
        businessName: vendor.businessName
      });

      return res.status(200).json({
        success: true,
        message: 'Vendor profile retrieved successfully',
        vendor
      });
    } catch (dbError) {
      console.error('Database error in getVendorProfile:', {
        error: dbError.message,
        code: dbError.code,
        stack: dbError.stack,
        name: dbError.name
      });

      // Check for specific database errors
      if (dbError.name === 'MongooseError') {
        return res.status(500).json({ 
          success: false,
          message: 'Database connection error',
          error: dbError.message 
        });
      }

      if (dbError.name === 'CastError') {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid ID format',
          error: dbError.message 
        });
      }

      return res.status(500).json({ 
        success: false,
        message: 'Database error while fetching vendor profile',
        error: dbError.message 
      });
    }
  } catch (error) {
    console.error('Error in getVendorProfile:', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name
    });
    
    return res.status(500).json({ 
      success: false,
      message: 'Error fetching/creating vendor profile',
      error: error.message 
    });
  }
};

// Get vendor availability
const getVendorAvailability = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const availability = vendor.availability || [];
    res.status(200).json(availability);
  } catch (error) {
    console.error('Error fetching vendor availability:', error);
    res.status(500).json({ message: 'Error fetching availability', error: error.message });
  }
};

// Update vendor availability
const updateVendorAvailability = async (req, res) => {
  try {
    const { date, eventsBooked, isFullyBooked, notes } = req.body;

    const vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Find existing availability entry or create new one
    const availabilityIndex = vendor.availability.findIndex(
      a => new Date(a.date).toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0]
    );

    if (availabilityIndex > -1) {
      // Update existing entry
      vendor.availability[availabilityIndex] = {
        date,
        eventsBooked,
        isFullyBooked,
        notes
      };
    } else {
      // Add new entry
      vendor.availability.push({
        date,
        eventsBooked,
        isFullyBooked,
        notes
      });
    }

    await vendor.save();
    res.status(200).json({ message: 'Availability updated successfully', availability: vendor.availability });
  } catch (error) {
    console.error('Error updating vendor availability:', error);
    res.status(500).json({ message: 'Error updating availability', error: error.message });
  }
};

// Update vendor settings
const updateVendorSettings = async (req, res) => {
  try {
    const { maxEventsPerDay, workingHours } = req.body;

    const vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Update settings
    vendor.maxEventsPerDay = maxEventsPerDay;
    vendor.workingHours = workingHours;

    await vendor.save();
    res.status(200).json({ 
      message: 'Settings updated successfully',
      settings: {
        maxEventsPerDay: vendor.maxEventsPerDay,
        workingHours: vendor.workingHours
      }
    });
  } catch (error) {
    console.error('Error updating vendor settings:', error);
    res.status(500).json({ message: 'Error updating settings', error: error.message });
  }
};

module.exports = {
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
};
