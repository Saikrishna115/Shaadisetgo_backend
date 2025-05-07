const express = require('express');
const router = express.Router();
const { createVendor, getVendors, getVendorById, updateVendor } = require('../controllers/vendorController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, createVendor);
router.get('/', getVendors);
router.get('/:id', getVendorById);
router.put('/:id', verifyToken, updateVendor);

module.exports = router;
