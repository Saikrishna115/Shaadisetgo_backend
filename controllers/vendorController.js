const Vendor = require('../models/Vendor');

// Create a new vendor
const createVendor = async (req, res) => {
  try {
    // Check if vendor profile already exists for this user
    const existingVendor = await Vendor.findOne({ userId: req.user.id });
    if (existingVendor) {
      return res.status(400).json({ message: 'Vendor profile already exists for this user' });
    }

    // Validate required fields
    const requiredFields = ['businessName', 'ownerName', 'email', 'phone', 'location', 'serviceCategory'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        fields: missingFields
      });
    }

    // Create vendor profile
    const vendor = await Vendor.create({
      ...req.body,
      userId: req.user.id,
      email: req.body.email || req.user.email, // Use user email if not provided
      isActive: true
    });

    res.status(201).json(vendor);
  } catch (error) {
    console.error('Error creating vendor profile:', error);
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({ message: 'Email already registered as vendor' });
    }
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
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.status(200).json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Error updating vendor', error });
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
