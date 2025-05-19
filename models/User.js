const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SALT_WORK_FACTOR = 12; // Increased from 10 to 12 for better security

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password by default in queries
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'vendor', 'customer'],
      message: '{VALUE} is not a valid role'
    },
    default: 'customer'
  },
  address: String,
  city: String,
  state: String,
  pincode: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
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
  timestamps: true 
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  try {
    // Only hash the password if it has been modified or is new
    if (!this.isModified('password')) return next();

    // Generate a strong salt
    const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
    
    // Hash the password along with the new salt
    const hash = await bcrypt.hash(this.password, salt);
    
    // Override the cleartext password with the hashed one
    this.password = hash;
    
    // If password is changed, update passwordChangedAt
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second for safety
    
    next();
  } catch (error) {
    next(error);
  }
});

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

// Generate JWT token
userSchema.methods.generateToken = function() {
  return jwt.sign(
    { 
      _id: this._id, 
      role: this.role,
      version: this.passwordChangedAt ? this.passwordChangedAt.getTime() : 'v1'
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      algorithm: 'HS256'
    }
  );
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
