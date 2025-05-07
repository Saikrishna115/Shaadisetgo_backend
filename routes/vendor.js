const express = require('express');
const Vendor = require('../models/Vendor');
const router = express.Router();

// Get all vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// Add a new vendor
router.post('/', async (req, res) => {
  try {
    const vendor = await Vendor.create(req.body);
    res.status(201).json(vendor);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add vendor' });
  }
});

module.exports = router;
