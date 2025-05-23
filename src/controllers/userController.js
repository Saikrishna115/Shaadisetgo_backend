const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { uploadToCloudinary, removeFromCloudinary } = require('../utils/cloudinary');

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update user profile
const updateProfile = catchAsync(async (req, res, next) => {
  const allowedFields = ['fullName', 'phone', 'location'];
  const updates = {};

  // Filter allowed fields
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Handle profile picture upload
  if (req.file) {
    const result = await uploadToCloudinary(req.file.path, 'profiles');
    if (result.secure_url) {
      // Remove old profile picture if exists
      if (req.user.profilePicture) {
        await removeFromCloudinary(req.user.profilePicture);
      }
      updates.profilePicture = result.secure_url;
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updates,
    {
      new: true,
      runValidators: true
    }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Delete user profile
const deleteUserProfile = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.user.id);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User profile deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current and new password', 400));
  }

  if (newPassword !== confirmPassword) {
    return next(new AppError('Passwords do not match', 400));
  }

  const user = await User.findById(req.user.id).select('+password');

  if (!user || !(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password updated successfully'
  });
});

const updatePreferences = catchAsync(async (req, res, next) => {
  const { notifications, privacy } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      'preferences.notifications': notifications,
      'preferences.privacy': privacy
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      preferences: user.preferences
    }
  });
});

const deleteAccount = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!user || !(await user.comparePassword(req.body.password))) {
    return next(new AppError('Password is incorrect', 401));
  }

  // Remove profile picture from cloudinary if exists
  if (user.profilePicture) {
    await removeFromCloudinary(user.profilePicture);
  }

  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

const getProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

module.exports = {
    getUserProfile,
    updateProfile,
    deleteUserProfile,
    updatePassword,
    updatePreferences,
    deleteAccount,
    getProfile
};
