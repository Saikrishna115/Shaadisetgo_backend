const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Protect routes - Authentication check
const protect = catchAsync(async (req, res, next) => {
  // 1) Get token and check if it exists
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // 2) Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // 4) Check if user changed password after the token was issued
  if (user.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password! Please log in again.', 401));
  }

  // Grant access to protected route
  req.user = user;
  next();
});

// Role authorization
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

// Vendor status check
const checkVendorStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'vendor') {
      return next();
    }

    const vendorProfile = await Vendor.findOne({ userId: req.user._id });
    
    if (!vendorProfile) {
      return res.status(403).json({
        success: false,
        code: 'VENDOR_PROFILE_MISSING',
        message: 'Vendor profile not found. Please complete your profile setup',
        nextStep: '/vendor/setup'
      });
    }

    if (!vendorProfile.isActive) {
      return res.status(403).json({
        success: false,
        code: 'VENDOR_INACTIVE',
        message: 'Your vendor account is currently inactive. Please contact support',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@shaadisetgo.com'
      });
    }

    req.vendorProfile = vendorProfile;
    next();
  } catch (error) {
    console.error('Vendor status check error:', error);
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred while checking vendor status'
    });
  }
};

module.exports = {
  protect,
  restrictTo,
  checkVendorStatus
}; 