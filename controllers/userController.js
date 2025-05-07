const User = require('../models/User');

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    
    // Ensure the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify user can only update their own profile
    if (req.user.id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    // Remove sensitive fields from updates (e.g., password and role)
    delete updates.password;
    delete updates.role;

    // Perform the update
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { updateProfile };
