const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  // Business Details
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessName: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },

  // Location Details
  location: {
    city: { type: String, required: true },
    state: { type: String },
    pincode: { type: String },
    address: { type: String },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },

  // Service Information
  serviceCategory: { 
    type: String, 
    required: true,
    enum: ['Venue', 'Catering', 'Photography', 'DJ', 'Decor', 'Other']
  },
  serviceDescription: { type: String },
  experienceYears: { type: Number },
  priceRange: {
    min: { type: Number },
    max: { type: Number }
  },

  // Availability and Capacity Management
  maxEventsPerDay: { type: Number, default: 1 },
  availability: [{
    date: { type: Date },
    eventsBooked: { type: Number, default: 0 },
    isFullyBooked: { type: Boolean, default: false },
    notes: { type: String }
  }],
  workingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '18:00' }
  },
  blockedDates: [{ 
    date: { type: Date },
    reason: { type: String }
  }],

  tags: [{ type: String }],

  // Media & Assets
  profileImage: { type: String },
  gallery: [{ type: String }],

  // Status & Verification
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // Ratings & Reviews
  rating: { 
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  reviews: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Add index for location-based queries
vendorSchema.index({ 'location.city': 1, 'location.state': 1 });

// Add index for service category and rating
vendorSchema.index({ serviceCategory: 1, 'rating.average': -1 });

// Add index for availability queries
vendorSchema.index({ 'availability.date': 1, 'availability.isFullyBooked': 1 });

module.exports = mongoose.model('Vendor', vendorSchema);
