const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  createVendor,
  getVendors,
  getVendorById,
  getVendorByUserId,
  updateVendor,
  deleteVendor,
  getAdminVendors,
  updateVendorStatus
} = require('../controllers/vendorController');

router.get('/', getVendors);
router.get('/user/:userId', getVendorByUserId);
router.get('/:id', getVendorById);

// ✅ Secure vendor creation route
router.post('/', verifyToken, createVendor);

router.put('/:id', verifyToken, updateVendor);
router.delete('/:id', verifyToken, deleteVendor);

router.get('/admin/vendors', verifyToken, getAdminVendors);
router.put('/admin/vendor-status/:id', verifyToken, updateVendorStatus);

module.exports = router;
