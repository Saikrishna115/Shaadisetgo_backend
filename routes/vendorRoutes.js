const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

const { 
  createVendor, 
  getVendors, 
  getVendorById, 
  updateVendor, 
  deleteVendor,
  getAdminVendors, 
  updateVendorStatus 
} = require('../controllers/vendorController');

// 🔓 Public routes
router.get('/', getVendors);                // Get all vendors
router.get('/:id', getVendorById);          // Get vendor by ID

// 🔐 Protected vendor routes (requires login)
router.post('/', verifyToken, createVendor);              // Create vendor
router.put('/:id', verifyToken, updateVendor);            // Update vendor
router.delete('/:id', verifyToken, deleteVendor);         // Delete vendor

// 🔐🔐 Admin routes (can add role-check later if needed)
router.get('/admin/vendors', verifyToken, getAdminVendors);                      // Admin: Get all vendors
router.put('/admin/vendor-status/:id', verifyToken, updateVendorStatus);        // Admin: Update status

module.exports = router;
