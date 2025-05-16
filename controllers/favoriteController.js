const Favorite = require('../models/Favorite');
const Vendor = require('../models/Vendor');

// Get user's favorite vendors
const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id })
      .populate('vendorId', 'businessName serviceType location priceRange rating')
      .sort({ createdAt: -1 });

    const formattedFavorites = favorites.map(fav => ({
      _id: fav._id,
      businessName: fav.vendorId.businessName,
      serviceType: fav.vendorId.serviceType,
      location: fav.vendorId.location,
      priceRange: fav.vendorId.priceRange,
      rating: fav.vendorId.rating
    }));

    res.json(formattedFavorites);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};

// Add vendor to favorites
const addFavorite = async (req, res) => {
  try {
    const { vendorId } = req.body;
    
    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      userId: req.user.id,
      vendorId
    });

    if (existingFavorite) {
      return res.status(400).json({ error: 'Vendor already in favorites' });
    }

    const favorite = await Favorite.create({
      userId: req.user.id,
      vendorId
    });

    res.status(201).json(favorite);
  } catch (err) {
    console.error('Error adding favorite:', err);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
};

// Remove vendor from favorites
const removeFavorite = async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const favorite = await Favorite.findOneAndDelete({
      userId: req.user.id,
      vendorId
    });

    if (!favorite) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Favorite removed successfully' });
  } catch (err) {
    console.error('Error removing favorite:', err);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite
}; 