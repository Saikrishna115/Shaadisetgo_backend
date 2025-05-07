const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic Information
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ['customer', 'vendor', 'admin'], default: 'customer' },

  // Location Details
  location: {
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    address: { type: String }
  },

  // Event Details
  eventDetails: {
    eventType: { type: String, enum: ['Wedding', 'Reception', 'Mehndi', 'Sangeet', 'Other'] },
    eventDate: { type: Date },
    estimatedBudget: {
      min: { type: Number },
      max: { type: Number }
    },
    numberOfGuests: { type: Number }
  },

  // Preferences
  preferences: {
    preferredVendors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }],
    servicesNeeded: [{ type: String }]
  },

  // Optional Enhancements
  profilePicture: { type: String },
  specialRequests: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
