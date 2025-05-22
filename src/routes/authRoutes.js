const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { 
  register, 
  login, 
  getProfile,
  refreshToken 
} = require('../controllers/authController');
const { 
  protect, 
  authorize,
  checkVendorStatus 
} = require('../middleware/auth');
const {
  registerValidator,
  loginValidator
} = require('../middleware/validators/auth.validator');

// Test route to verify routing is working
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes are working' });
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerValidator, register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', loginValidator, login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Public
 */
router.post('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/me', protect, checkVendorStatus, getProfile);

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
router.get('/admin/users', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Error fetching users'
    });
  }
});

/**
 * @route   GET /api/auth/vendor/profile
 * @desc    Get vendor profile
 * @access  Private
 */
router.get('/vendor/profile', protect, authorize('vendor'), checkVendorStatus, async (req, res) => {
  try {
    const vendorProfile = req.vendorProfile;
    res.json({
      success: true,
      data: vendorProfile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Error fetching vendor profile'
    });
  }
});

module.exports = router;
