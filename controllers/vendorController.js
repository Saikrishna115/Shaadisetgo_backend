const Vendor = require('../models/Vendor');
const User = require('../models/User');

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

// Get a specific vendor by vendor ID
const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.status(200).json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendor', error });
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
    console.log('Fetching vendor profile for user:', req.user._id);
    const userId = req.user._id;
    const vendor = await Vendor.findOne({ userId });
    
    if (!vendor) {
      console.log('No vendor profile found, creating initial profile');
      // If no vendor profile exists, create one with basic information
      const user = await User.findById(userId);
      if (!user) {
        console.error('User not found:', userId);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Create initial vendor profile with all required fields
      const newVendor = await Vendor.create({
        userId,
        businessName: user.fullName || 'My Business',
        ownerName: user.fullName,
        email: user.email,
        phone: user.phone || '',
        location: {
          city: 'Your City',
          state: 'Your State'
        },
        serviceCategory: 'Other',
        serviceDescription: 'New Vendor Profile',
        isActive: true,
        priceRange: {
          min: 0,
          max: 0
        },
        rating: {
          average: 0,
          count: 0
        }
      });

      console.log('Created initial vendor profile:', newVendor._id);
      return res.status(200).json({
        success: true,
        message: 'Initial vendor profile created',
        vendor: newVendor
      });
    }

    console.log('Found existing vendor profile:', vendor._id);
    res.status(200).json({
      success: true,
      message: 'Vendor profile retrieved successfully',
      vendor
    });
  } catch (error) {
    console.error('Error in getVendorProfile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching/creating vendor profile',
      error: error.message 
    });
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
  getVendorProfile
};
