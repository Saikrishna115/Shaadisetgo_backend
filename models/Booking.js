const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  vendorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vendor', 
    required: true 
  },
  eventDate: { 
    type: Date, 
    required: true 
  },
  eventType: { 
    type: String, 
    required: true 
  },
  guestCount: { 
    type: Number, 
    required: true 
  },
  budget: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'], 
    default: 'pending' 
  },
  message: { 
    type: String 
  },
  vendorResponse: {
    type: String,
    default: ''
  },
  vendorResponseDate: {
    type: Date
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  vendorName: {
    type: String,
    required: true
  },
  vendorService: {
    type: String,
    required: true
  }
}, { 
  timestamps: true 
});

// Add indexes for common queries
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ vendorId: 1, status: 1 });
bookingSchema.index({ eventDate: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
