const Favorite = require('../models/Favorite');
const Vendor = require('../models/Vendor');

// Get user's favorite vendors
const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.userId })
      .populate({
        path: 'vendorId',
        select: 'businessName serviceCategory location priceRange description images'
      });

    res.json({
      success: true,
      data: favorites.map(fav => fav.vendorId)
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching favorite vendors',
      error: error.message
    });
  }
};

// Add vendor to favorites
const addFavorite = async (req, res) => {
  try {
    const { vendorId } = req.body;

    // Check if vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      userId: req.user.userId,
      vendorId
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Vendor already in favorites'
      });
    }

    // Create new favorite
    const favorite = await Favorite.create({
      userId: req.user.userId,
      vendorId
    });

    res.status(201).json({
      success: true,
      message: 'Vendor added to favorites',
      data: favorite
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding vendor to favorites',
      error: error.message
    });
  }
};

// Remove vendor from favorites
const removeFavorite = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      userId: req.user.userId,
      vendorId
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    res.json({
      success: true,
      message: 'Vendor removed from favorites'
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing vendor from favorites',
      error: error.message
    });
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite
}; 