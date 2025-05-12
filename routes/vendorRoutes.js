const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const Vendor = require('../models/Vendor');
const {
  createVendor,
  getVendors,
  getVendorById,
  getVendorByUserId,
  updateVendor,
  deleteVendor,
  getAdminVendors,
  updateVendorStatus
} = require('../controllers/vendorController');  // Ensure correct import

// Vendor profile route
router.get('/profile', verifyToken, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const vendor = await Vendor.findOne({ userId: req.user.id }).populate('userId', 'fullName email role');
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found. Please create a vendor profile first.' });
    }

    if (vendor.userId.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. User is not a vendor.' });
    }

    res.status(200).json(vendor);
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    res.status(500).json({ message: 'Error fetching vendor profile', error: error.message });
  }
});

// Public routes
router.get('/', getVendors);
router.get('/user/:userId', getVendorByUserId);
router.get('/:id', getVendorById);

// Protected vendor routes
router.post('/', verifyToken, createVendor);  // Ensure createVendor is correctly imported
router.put('/:id', verifyToken, updateVendor);
router.delete('/:id', verifyToken, deleteVendor);

// Admin routes
router.get('/admin/vendors', verifyToken, getAdminVendors);  // Ensure getAdminVendors exists and is imported
router.put('/admin/vendor-status/:id', verifyToken, updateVendorStatus); // Ensure updateVendorStatus exists

module.exports = router;
