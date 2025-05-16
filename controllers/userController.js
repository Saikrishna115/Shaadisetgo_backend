const User = require('../models/User');

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
const updateUserProfile = async (req, res) => {
    try {
        const updates = req.body;
        
        // Remove sensitive fields from updates
        delete updates.password;
        delete updates.role;

        // Validate required fields
        const requiredFields = ['fullName', 'email', 'phone'];
        const missingFields = requiredFields.filter(field => !updates[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                message: 'Missing required fields',
                fields: missingFields
            });
        }

        // Create update object with validated fields
        const updateData = {
            fullName: updates.fullName,
            email: updates.email,
            phone: updates.phone,
            address: updates.address,
            city: updates.city,
            state: updates.state,
            pincode: updates.pincode
        };

        // Handle preferences if provided
        if (updates.preferences) {
            updateData.preferences = {
                eventType: updates.preferences.eventType,
                eventDate: updates.preferences.eventDate,
                budget: updates.preferences.budget,
                guestCount: updates.preferences.guestCount
            };
        }

        // Perform the update
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(updatedUser);
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

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

module.exports = {
    getUserProfile,
    updateUserProfile,
    deleteUserProfile
};
