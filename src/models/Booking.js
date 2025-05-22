const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['customer', 'vendor'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

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
  messageHistory: [messageSchema],
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
  },
  // Additional fields for better management
  eventLocation: {
    type: String
  },
  specialRequirements: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed'],
    default: 'pending'
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  lastUpdatedBy: {
    type: String,
    enum: ['customer', 'vendor', 'system'],
    default: 'system'
  },
  cancellationReason: {
    type: String
  },
  cancellationDate: {
    type: Date
  },
  completionNotes: {
    type: String
  }
}, { 
  timestamps: true 
});

// Add indexes for common queries
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ vendorId: 1, status: 1 });
bookingSchema.index({ eventDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
