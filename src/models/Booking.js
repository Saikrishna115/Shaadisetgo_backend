const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['customer', 'vendor', 'system'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  attachments: [{
    url: String,
    type: String,
    name: String
  }]
});

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet'],
    required: true
  },
  transactionId: String,
  paymentGatewayResponse: Object,
  paidAt: Date,
  refundedAt: Date
});

const bookingSchema = new mongoose.Schema({
  // Basic Information
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
  serviceCategory: {
    type: String,
    required: true
  },

  // Event Details
  eventDate: { 
    type: Date, 
    required: true 
  },
  eventType: { 
    type: String, 
    required: true,
    enum: ['Wedding', 'Reception', 'Engagement', 'Sangeet', 'Mehendi', 'Other']
  },
  eventLocation: {
    venue: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  guestCount: { 
    type: Number, 
    required: true 
  },

  // Package and Pricing
  selectedPackage: {
    id: String,
    name: String,
    description: String,
    price: Number,
    features: [String]
  },
  customRequirements: String,
  budget: { 
    type: Number, 
    required: true 
  },
  quotedPrice: Number,
  finalPrice: Number,

  // Booking Status
  status: { 
    type: String, 
    enum: ['draft', 'pending', 'quote_provided', 'quote_accepted', 'payment_pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected'], 
    default: 'draft' 
  },
  bookingStep: {
    type: String,
    enum: ['details', 'requirements', 'quote', 'payment', 'confirmation'],
    default: 'details'
  },
  vendorResponse: {
    type: String,
    default: ''
  },
  vendorResponseDate: Date,

  // Communication
  messageHistory: [messageSchema],
  lastMessageAt: Date,
  unreadCustomerMessages: { type: Number, default: 0 },
  unreadVendorMessages: { type: Number, default: 0 },

  // Customer Information
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

  // Payment Information
  payments: [paymentSchema],
  totalPaid: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['not_started', 'partial', 'complete', 'refunded'],
    default: 'not_started'
  },

  // Cancellation
  cancellationReason: String,
  cancelledBy: {
    type: String,
    enum: ['customer', 'vendor', 'admin']
  },
  cancellationDate: Date,
  refundStatus: {
    type: String,
    enum: ['not_applicable', 'pending', 'processed', 'completed'],
    default: 'not_applicable'
  },

  // Review
  reviewed: {
    type: Boolean,
    default: false
  },
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: Date,
  completedAt: Date
});

// Update timestamp before saving
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update payment status when payments array changes
bookingSchema.pre('save', function(next) {
  if (this.isModified('payments')) {
    const total = this.payments.reduce((sum, payment) => {
      return payment.status === 'completed' ? sum + payment.amount : sum;
    }, 0);
    
    this.totalPaid = total;
    
    if (total === 0) {
      this.paymentStatus = 'not_started';
    } else if (total < this.finalPrice) {
      this.paymentStatus = 'partial';
    } else {
      this.paymentStatus = 'complete';
    }
  }
  next();
});

// Update message counters
bookingSchema.methods.updateMessageCounters = function(sender) {
  if (sender === 'customer') {
    this.unreadVendorMessages += 1;
  } else if (sender === 'vendor') {
    this.unreadCustomerMessages += 1;
  }
  this.lastMessageAt = Date.now();
};

// Reset message counter
bookingSchema.methods.resetMessageCounter = function(userType) {
  if (userType === 'customer') {
    this.unreadCustomerMessages = 0;
  } else if (userType === 'vendor') {
    this.unreadVendorMessages = 0;
  }
};

// Indexes
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ vendorId: 1, status: 1 });
bookingSchema.index({ eventDate: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ 'eventLocation.coordinates': '2dsphere' });

module.exports = mongoose.model('Booking', bookingSchema);
