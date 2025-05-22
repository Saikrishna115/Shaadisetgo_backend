const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { 
  register, 
  login, 
  getProfile,
  refreshToken,
  getMe,
  updatePassword
} = require('../controllers/authController');
const { 
  protect, 
  restrictTo,
  checkVendorStatus 
} = require('../middleware/auth');
const {
  registerValidator,
  loginValidator,
  updatePasswordValidator
} = require('../middleware/validators/auth.validator');
const validate = require('../middleware/validate');
const { AppError } = require('../utils/appError');

// Test route to verify routing is working
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes are working' });
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(registerValidator), register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', validate(loginValidator), login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Public
 */
router.post('/logout', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/me', protect, checkVendorStatus, getMe);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh user token
 * @access  Private
 */
router.post('/refresh-token', refreshToken);

/**
 * @route   GET /api/auth/admin/users
 * @desc    Get all users (admin only)
 * @access  Private
 */
router.get('/admin/users', protect, restrictTo('admin'), async (req, res) => {
  try {
    const users = await User.findOne().select('-password');
    res.status(200).json({
      status: 'success',
      data: users
    });
  } catch (error) {
    next(new AppError('Error fetching users', 500));
  }
});

/**
 * @route   GET /api/auth/vendor/profile
 * @desc    Get vendor profile
 * @access  Private
 */
router.get('/vendor/profile', protect, restrictTo('vendor'), checkVendorStatus, async (req, res) => {
  try {
    const vendorProfile = req.vendorProfile;
    res.status(200).json({
      status: 'success',
      data: vendorProfile
    });
  } catch (error) {
    next(new AppError('Error fetching vendor profile', 500));
  }
});

/**
 * @route   PATCH /api/auth/update-password
 * @desc    Update user password
 * @access  Private
 */
router.patch('/update-password', protect, validate(updatePasswordValidator), updatePassword);

module.exports = router;
