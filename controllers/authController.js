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

    // Validate fullName format
    const nameRegex = /^[a-zA-Z\s]{3,100}$/;
    if (!nameRegex.test(fullName)) {
      return res.status(400).json({
        success: false,
        message: 'Full name must be between 3 and 100 characters and contain only letters and spaces'
      });
    }

    // Validate that fullName has at least two parts
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both first name and last name'
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
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])[A-Za-z\d\W_]{8,}$/;
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
      role,
      phone,
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
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error registering user' 
    });
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Input validation with specific error messages
    if (!email && !password) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_CREDENTIALS',
        message: 'Please provide both email and password'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_EMAIL',
        message: 'Please provide your email'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_PASSWORD',
        message: 'Please provide your password'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_EMAIL_FORMAT',
        message: ERROR_MESSAGES.INVALID_EMAIL
      });
    }

    // Find user with password (password select is false by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: ERROR_MESSAGES.INVALID_CREDENTIALS
      });
    }

    try {
      // This will handle password comparison and account locking
      const isMatch = await user.comparePassword(password);
      
      if (!isMatch) {
        // Get remaining attempts before lockout
        const remainingAttempts = 5 - (user.loginAttempts + 1);
        
        return res.status(401).json({
          success: false,
          code: user.isLocked() ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS',
          message: user.isLocked() 
            ? ERROR_MESSAGES.ACCOUNT_LOCKED 
            : remainingAttempts > 0 
              ? `${ERROR_MESSAGES.INVALID_CREDENTIALS}. ${remainingAttempts} attempts remaining before account lockout.`
              : ERROR_MESSAGES.INVALID_CREDENTIALS,
          remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0,
          lockoutDuration: user.isLocked() ? Math.ceil((user.lockUntil - Date.now()) / 1000 / 60) : null
        });
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        code: 'AUTH_ERROR',
        message: error.message
      });
    }

    // Additional vendor checks
    if (user.role === 'vendor') {
      const vendorProfile = await Vendor.findOne({ userId: user._id });
      
      if (!vendorProfile) {
        return res.status(403).json({
          success: false,
          code: 'VENDOR_PROFILE_MISSING',
          message: ERROR_MESSAGES.VENDOR_PROFILE_MISSING,
          nextStep: '/vendor/setup'
        });
      }

      if (!vendorProfile.isActive) {
        return res.status(403).json({
          success: false,
          code: 'VENDOR_INACTIVE',
          message: ERROR_MESSAGES.VENDOR_INACTIVE,
          supportEmail: process.env.SUPPORT_EMAIL || 'support@shaadisetgo.com'
        });
      }
    }

    // Generate token with password change timestamp and shorter expiry
    const token = generateToken(user._id, user.role, user.passwordChangedAt?.getTime());
    
    // Generate refresh token with longer expiry
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    console.log('Login successful:', {
      userId: user._id,
      role: user.role,
      timestamp: new Date().toISOString()
    });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      code: 'LOGIN_SUCCESS',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        lastLogin: user.lastLogin
      },
      expiresIn: parseInt(process.env.JWT_EXPIRES_IN) || 86400 // 24 hours in seconds
    });
  } catch (error) {
    console.error('Login error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.'
    });
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

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        code: 'REFRESH_TOKEN_MISSING',
        message: 'No refresh token provided'
      });
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Get user
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'User no longer exists'
        });
      }

      // Check if user's password has changed since token was issued
      if (user.passwordChangedAfterToken(decoded.iat)) {
        return res.status(401).json({
          success: false,
          code: 'PASSWORD_CHANGED',
          message: 'Password has been changed. Please login again'
        });
      }

      // Generate new access token
      const newToken = generateToken(user._id, user.role, user.passwordChangedAt?.getTime());

      // Generate new refresh token
      const newRefreshToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Set new refresh token in cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        success: true,
        code: 'TOKEN_REFRESHED',
        token: newToken,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          phone: user.phone,
          lastLogin: user.lastLogin
        },
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN) || 86400
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token'
      });
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred while refreshing token'
    });
  }
};

module.exports = { 
  register, 
  login, 
  getProfile,
  refreshToken 
};
