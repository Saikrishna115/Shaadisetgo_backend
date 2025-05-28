const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['General', 'Booking', 'Payments', 'Vendors', 'Account']
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
faqSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for frequently queried fields
faqSchema.index({ category: 1, order: 1 });
faqSchema.index({ isActive: 1 });

module.exports = mongoose.model('FAQ', faqSchema);