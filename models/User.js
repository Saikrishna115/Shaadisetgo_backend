const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SALT_WORK_FACTOR = 12; // Increased from 10 to 12 for better security

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Please provide your phone number']
  },
  role: {
    type: String,
    enum: ['customer', 'vendor', 'admin'],
    default: 'customer'
  },
  address: String,
  city: String,
  state: String,
  pincode: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  passwordChangedAt: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  preferences: {
    type: Object,
    default: {}
  },
  profilePicture: {
    url: String,
    thumbnail: String,
    deleteUrl: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for firstName and lastName
userSchema.virtual('firstName').get(function() {
  if (this.fullName) {
    return this.fullName.split(' ')[0];
  }
  return '';
});

userSchema.virtual('lastName').get(function() {
  if (this.fullName) {
    const nameParts = this.fullName.split(' ');
    return nameParts.slice(1).join(' ');
  }
  return '';
});

// Index for faster queries
userSchema.index({ role: 1 });
userSchema.index({ email: 1 }, { unique: true });

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Verify password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // First check if account is locked
    if (this.isLocked()) {
      throw new Error('Account is temporarily locked. Please try again later.');
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    
    // Handle failed login attempt
    if (!isMatch) {
      await this.handleFailedLogin();
      return false;
    }

    // Reset login attempts on successful login
    if (this.loginAttempts > 0) {
      await this.resetLoginAttempts();
    }

    // Update last login time
    this.lastLogin = new Date();
    await this.save();

    return true;
  } catch (error) {
    throw error;
  }
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  // Check for a temporary lock
  if (this.lockUntil && this.lockUntil > Date.now()) {
    return true;
  }
  return false;
};

// Handle failed login attempt
userSchema.methods.handleFailedLogin = async function() {
  // Increment login attempts
  this.loginAttempts += 1;
  
  // Lock account if too many attempts (5)
  if (this.loginAttempts >= 5) {
    // Lock for 1 hour
    this.lockUntil = Date.now() + (60 * 60 * 1000);
  }
  
  await this.save();
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

// Check if password was changed after token was issued
userSchema.methods.passwordChangedAfterToken = function(tokenIssuedAt) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return tokenIssuedAt < changedTimestamp;
  }
  return false;
};

module.exports = mongoose.model('User', userSchema);
