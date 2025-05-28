const mongoose = require('mongoose');
const axios = require('axios');

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
      type: [Number],
      index: '2dsphere'
    }
  },

  // Service Information
  serviceCategory: { 
    type: String, 
    required: true,
    enum: ['Venue', 'Catering', 'Photography', 'DJ', 'Decor', 'Makeup', 'Transportation', 'Entertainment', 'Other']
  },
  serviceDescription: { type: String },
  experienceYears: { type: Number },
  priceRange: {
    min: { type: Number },
    max: { type: Number }
  },
  packages: [{
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    features: [String],
    isPopular: { type: Boolean, default: false }
  }],

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

  // Tags and Categories
  tags: [{ type: String }],
  specialties: [{ type: String }],
  amenities: [{ type: String }],

  // Media & Assets
  profileImage: {
    url: { type: String },
    thumbnail: { type: String },
    deleteUrl: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  },
  gallery: [{
    url: { type: String, required: true },
    thumbnail: { type: String, required: true },
    deleteUrl: { type: String, required: true },
    caption: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  workImages: [{
    url: { type: String, required: true },
    thumbnail: { type: String, required: true },
    deleteUrl: { type: String, required: true },
    description: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  videoUrls: [{
    url: { type: String },
    thumbnail: { type: String },
    title: { type: String }
  }],

  // Reviews and Ratings
  reviews: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String },
    images: [{
      url: String,
      caption: String
    }],
    createdAt: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false }
  }],
  averageRating: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },

  // Business Details
  businessHours: [{
    day: { 
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    isOpen: { type: Boolean, default: true },
    openTime: String,
    closeTime: String
  }],
  paymentMethods: [{
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other']
  }],
  cancellationPolicy: {
    type: String,
    enum: ['Flexible', 'Moderate', 'Strict']
  },

  // Verification and Status
  isVerified: { type: Boolean, default: false },
  verificationDate: Date,
  status: { 
    type: String,
    enum: ['Active', 'Inactive', 'Pending', 'Suspended'],
    default: 'Pending'
  },
  featured: { type: Boolean, default: false },

  // Analytics
  views: { type: Number, default: 0 },
  bookmarks: { type: Number, default: 0 },
  inquiries: { type: Number, default: 0 },
  responseRate: { type: Number, default: 0 },
  responseTime: { type: Number }, // in minutes

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp before saving
vendorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate average rating before saving
vendorSchema.pre('save', function(next) {
  if (this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.averageRating = totalRating / this.reviews.length;
    this.totalReviews = this.reviews.length;
  }
  next();
});

// Methods for image management
vendorSchema.methods.addWorkImage = async function(imageData) {
  this.workImages.push({
    ...imageData,
    uploadedAt: new Date()
  });
  return this.save();
};

vendorSchema.methods.removeWorkImage = async function(imageUrl) {
  const image = this.workImages.find(img => img.url === imageUrl);
  if (image && image.deleteUrl) {
    try {
      await axios.delete(image.deleteUrl);
      this.workImages = this.workImages.filter(img => img.url !== imageUrl);
      await this.save();
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }
  return false;
};

vendorSchema.methods.addGalleryImage = async function(imageData) {
  this.gallery.push({
    ...imageData,
    uploadedAt: new Date()
  });
  return this.save();
};

vendorSchema.methods.removeGalleryImage = async function(imageUrl) {
  const image = this.gallery.find(img => img.url === imageUrl);
  if (image && image.deleteUrl) {
    try {
      await axios.delete(image.deleteUrl);
      this.gallery = this.gallery.filter(img => img.url !== imageUrl);
      await this.save();
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }
  return false;
};

// Indexes for search and filtering
vendorSchema.index({ 'location.city': 1, serviceCategory: 1 });
vendorSchema.index({ 'location.coordinates': '2dsphere' });
vendorSchema.index({ averageRating: -1 });
vendorSchema.index({ 'priceRange.min': 1, 'priceRange.max': 1 });
vendorSchema.index({ tags: 1 });
vendorSchema.index({ featured: 1 });
vendorSchema.index({ status: 1 });

// Full text search indexes
vendorSchema.index({
  businessName: 'text',
  serviceDescription: 'text',
  tags: 'text',
  specialties: 'text',
  'location.city': 'text'
});

module.exports = mongoose.model('Vendor', vendorSchema);
