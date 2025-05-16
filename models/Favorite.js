const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  }
}, { timestamps: true });

// Create a compound index to ensure a user can't favorite the same vendor twice
favoriteSchema.index({ userId: 1, vendorId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema); 