const Vendor = require('../models/Vendor');

const createVendor = async (req, res) => {
  try {
    const vendor = await Vendor.create({ ...req.body, userId: req.user.id });
    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Error creating vendor', error });
  }
};

const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.status(200).json(vendors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendors', error });
  }
};

const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.status(200).json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendor', error });
  }
};

const getVendorByUserId = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.params.userId });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.status(200).json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendor', error });
  }
};

const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Error updating vendor', error });
  }
};

module.exports = { createVendor, getVendors, getVendorById, getVendorByUserId, updateVendor };
