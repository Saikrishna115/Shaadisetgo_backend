const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

// Error messages
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_LOCKED: 'Account is temporarily locked. Please try again later',
  VENDOR_PROFILE_MISSING: 'Vendor profile not found. Please complete your profile setup',
  VENDOR_INACTIVE: 'Your vendor account is currently inactive. Please contact support',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PASSWORD: 'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character',
  USER_EXISTS: 'User with this email already exists',
  INVALID_PHONE: 'Please enter a valid 10-digit phone number',
  INVALID_ROLE: 'Invalid role. Must be either "customer" or "vendor"'
};

// Generate JWT token with secure settings
const generateToken = (userId, role, passwordTimestamp) => {
  return jwt.sign(
    { 
      _id: userId, 
      role,
      version: passwordTimestamp || 'v1'
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      algorithm: 'HS256'
    }
  );
};

const register = async (req, res, next) => {
  try {
    const { fullName, email, password, role, phone } = req.body;

    // Validate required fields
    const requiredFields = ['fullName', 'email', 'password', 'phone', 'role'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        fields: missingFields
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_EMAIL
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_PASSWORD
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.USER_EXISTS
      });
    }

    // Validate phone number
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_PHONE
      });
    }

    // Validate role
    const validRoles = ['customer', 'vendor'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_ROLE
      });
    }

    // Validate vendor-specific fields
    if (role === 'vendor') {
      const vendorFields = ['businessName', 'ownerName', 'serviceCategory', 'address', 'city', 'state', 'zipCode'];
      const missingVendorFields = vendorFields.filter(field => !req.body[field]);
      if (missingVendorFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required vendor fields',
          fields: missingVendorFields
        });
      }
    }

    // Create new user with enhanced security
    const user = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase(),
      password,
      role: role || 'customer',
      phone: phone.trim(),
      ...(role === 'vendor' && { vendorDetails: req.body.vendorDetails }),
      lastLogin: new Date(),
      loginAttempts: 0
    });

    // Generate token
    const token = generateToken(user._id, user.role, user.passwordChangedAt?.getTime());

    // Create vendor profile if role is vendor
    if (role === 'vendor') {
      await Vendor.create({
        userId: user._id,
        businessName: req.body.businessName,
        ownerName: req.body.ownerName,
        email: user.email,
        phone: user.phone,
        serviceCategory: req.body.serviceCategory,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zipCode
      });
    }

    // Log successful registration
    console.log('User registered successfully:', {
      userId: user._id,
      email: user.email,
      role: user.role,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          phone: user.phone
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration Error:', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_EMAIL
      });
    }

    // Find user with password (password select is false by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_CREDENTIALS
      });
    }

    try {
      // This will handle password comparison and account locking
      const isMatch = await user.comparePassword(password);
      
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: user.isLocked() ? ERROR_MESSAGES.ACCOUNT_LOCKED : ERROR_MESSAGES.INVALID_CREDENTIALS
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Additional vendor checks
    if (user.role === 'vendor') {
      const vendorProfile = await Vendor.findOne({ userId: user._id });
      
      if (!vendorProfile) {
        return res.status(400).json({
          success: false,
          message: ERROR_MESSAGES.VENDOR_PROFILE_MISSING
        });
      }

      if (!vendorProfile.isActive) {
        return res.status(400).json({
          success: false,
          message: ERROR_MESSAGES.VENDOR_INACTIVE
        });
      }
    }

    // Generate token with password change timestamp
    const token = generateToken(user._id, user.role, user.passwordChangedAt?.getTime());

    // Log successful login
    console.log('Login successful:', {
      userId: user._id,
      role: user.role,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -loginAttempts -lockUntil');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile };
