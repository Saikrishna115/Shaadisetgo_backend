const User = require('../models/User');

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id); // Assuming you attach the user object via token
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile', error });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, { new: true });
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user profile', error });
  }
};

// Delete user profile
const deleteUserProfile = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user.id);
    if (!deletedUser) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User profile deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user profile', error });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile
};
