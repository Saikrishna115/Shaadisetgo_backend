const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

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

// Register new user
const register = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User already exists with this email', 400);
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user'
  });

  // Generate token
  const token = user.generateAuthToken();

  // Remove password from output
  user.password = undefined;

  res.status(201).json({
    status: 'success',
    token,
    user
  });
});

// Login user
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // Generate token
  const token = user.generateAuthToken();

  // Remove password from output
  user.password = undefined;

  res.status(200).json({
    status: 'success',
    token,
    user
  });
});

// Get current user
const getMe = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    user: req.user
  });
});

// Update password
const updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.correctPassword(currentPassword))) {
    return next(new AppError('Your current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new token
  const token = user.generateAuthToken();

  res.status(200).json({
    status: 'success',
    token,
    message: 'Password updated successfully'
  });
});

// Get user profile
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

// Refresh token
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
  refreshToken,
  getMe,
  updatePassword
};
