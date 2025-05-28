const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const vendorRoutes = require('./vendorRoutes');
const adminRoutes = require('./adminRoutes');
const bookingRoutes = require('./bookingRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const faqRoutes = require('./faqRoutes');
const supportTicketRoutes = require('./supportTicketRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vendors', vendorRoutes);
router.use('/admin', adminRoutes);
router.use('/bookings', bookingRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/faqs', faqRoutes);
router.use('/support', supportTicketRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;