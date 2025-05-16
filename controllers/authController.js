const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

// Generate JWT token with secure settings
const generateToken = (userId, role) => {
  return jwt.sign(
    { _id: userId, role },
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
    const requiredFields = ['fullName', 'email', 'password', 'phone'];
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
        message: 'Invalid email format'
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // Validate role
    const validRoles = ['customer', 'vendor'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either "customer" or "vendor"'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: role || 'customer',
      phone
    });

    // Generate token
    const token = generateToken(user._id, user.role);

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
    console.log('Login attempt:', { 
      email: req.body.email,
      hasPassword: !!req.body.password,
      timestamp: new Date().toISOString()
    });
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing credentials:', { email: !!email, password: !!password });
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', { email });
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Find user and check if they exist
    const user = await User.findOne({ email }).select('+password');
    console.log('User lookup result:', { 
      exists: !!user, 
      email,
      role: user?.role,
      userId: user?._id
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password verification:', { 
      isMatch,
      userId: user._id,
      timestamp: new Date().toISOString()
    });
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // If user is a vendor, check if they have a vendor profile
    if (user.role === 'vendor') {
      console.log('Checking vendor profile for user:', user._id);
      const vendorProfile = await Vendor.findOne({ userId: user._id });
      console.log('Vendor profile:', { 
        exists: !!vendorProfile, 
        isActive: vendorProfile?.isActive,
        userId: user._id
      });
      
      if (!vendorProfile) {
        return res.status(400).json({
          success: false,
          message: 'Vendor profile not found. Please complete your profile setup.'
        });
      }

      if (!vendorProfile.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Your vendor account is currently inactive. Please contact support.'
        });
      }
    }

    // Generate token and send response
    const token = generateToken(user._id, user.role);
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
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile };
