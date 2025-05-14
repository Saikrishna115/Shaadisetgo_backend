const Vendor = require('../models/Vendor');
const User = require('../models/User');

// Create a new vendor
const createVendor = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingVendor = await Vendor.findOne({ userId });
    if (existingVendor) {
      return res.status(400).json({ message: 'Vendor profile already exists' });
    }

    const requiredFields = ['businessName', 'ownerName', 'phone', 'location', 'serviceCategory'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ message: 'Missing required fields', fields: missingFields });
    }

    const vendor = await Vendor.create({
      ...req.body,
      userId,
      email: user.email,
      isActive: true
    });

    await User.findByIdAndUpdate(userId, { role: 'vendor' });

    res.status(201).json(vendor);
  } catch (error) {
    console.error('Error creating vendor profile:', error);
    res.status(500).json({ message: 'Error creating vendor profile', error: error.message });
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

module.exports = {
  createVendor,
  getVendors,
  getVendorById,
  getVendorByUserId,
  updateVendor,
  deleteVendor,
  getAdminVendors,
  updateVendorStatus
};
