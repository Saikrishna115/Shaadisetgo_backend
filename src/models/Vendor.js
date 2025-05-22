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
  }],

  workImages: [{
    url: { type: String, required: true },
    thumbnail: { type: String, required: true },
    deleteUrl: { type: String, required: true },
    caption: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],

  services: [{
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    images: [{
      url: { type: String, required: true },
      thumbnail: { type: String, required: true },
      deleteUrl: { type: String, required: true },
      caption: { type: String }
    }]
  }]
}, { 
  timestamps: true 
});

// Add index for location-based queries
vendorSchema.index({ 'location.city': 1, 'location.state': 1 });

// Add index for service category and rating
vendorSchema.index({ serviceCategory: 1, 'rating.average': -1 });

// Add index for availability queries
vendorSchema.index({ 'availability.date': 1, 'availability.isFullyBooked': 1 });

// Add index for image-related queries
vendorSchema.index({ 'workImages.uploadedAt': -1 });
vendorSchema.index({ 'gallery.uploadedAt': -1 });

// Pre-save middleware to validate and clean up images
vendorSchema.pre('save', function(next) {
  // Clean up work images
  if (this.workImages) {
    this.workImages = this.workImages.filter(img => 
      img.url && img.thumbnail && img.deleteUrl
    );
  }

  // Clean up gallery images
  if (this.gallery) {
    this.gallery = this.gallery.filter(img => 
      img.url && img.thumbnail && img.deleteUrl
    );
  }

  // Clean up service images
  if (this.services) {
    this.services.forEach(service => {
      if (service.images) {
        service.images = service.images.filter(img => 
          img.url && img.thumbnail && img.deleteUrl
        );
      }
    });
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

module.exports = mongoose.model('Vendor', vendorSchema);
