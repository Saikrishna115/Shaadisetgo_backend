const Vendor = require('../models/Vendor');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Advanced search with filtering, sorting, and pagination
exports.searchVendors = catchAsync(async (req, res) => {
  const {
    query,
    category,
    city,
    priceMin,
    priceMax,
    rating,
    sortBy,
    page = 1,
    limit = 10,
    tags,
    amenities,
    availability
  } = req.query;

  // Build filter object
  const filter = {};

  // Text search if query provided
  if (query) {
    filter.$text = { $search: query };
  }

  // Category filter
  if (category) {
    filter.serviceCategory = category;
  }

  // Location filter
  if (city) {
    filter['location.city'] = city;
  }

  // Price range filter
  if (priceMin || priceMax) {
    filter.priceRange = {};
    if (priceMin) filter.priceRange.$gte = Number(priceMin);
    if (priceMax) filter.priceRange.$lte = Number(priceMax);
  }

  // Rating filter
  if (rating) {
    filter.averageRating = { $gte: Number(rating) };
  }

  // Tags filter
  if (tags) {
    const tagArray = tags.split(',');
    filter.tags = { $in: tagArray };
  }

  // Amenities filter
  if (amenities) {
    const amenityArray = amenities.split(',');
    filter.amenities = { $all: amenityArray };
  }

  // Availability filter
  if (availability) {
    const date = new Date(availability);
    filter.blockedDates = {
      $not: {
        $elemMatch: {
          date: date
        }
      }
    };
    filter['availability.date'] = date;
    filter['availability.isFullyBooked'] = false;
  }

  // Only show active and verified vendors
  filter.status = 'Active';
  filter.isVerified = true;

  // Build sort object
  let sort = {};
  switch (sortBy) {
    case 'price_asc':
      sort = { 'priceRange.min': 1 };
      break;
    case 'price_desc':
      sort = { 'priceRange.max': -1 };
      break;
    case 'rating':
      sort = { averageRating: -1 };
      break;
    case 'reviews':
      sort = { totalReviews: -1 };
      break;
    case 'popularity':
      sort = { views: -1 };
      break;
    default:
      sort = { featured: -1, averageRating: -1 };
  }

  // Calculate skip value for pagination
  const skip = (page - 1) * limit;

  // Execute query with pagination
  const [vendors, total] = await Promise.all([
    Vendor.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-workImages -gallery')
      .lean(),
    Vendor.countDocuments(filter)
  ]);

  // Calculate availability and pricing summaries
  const vendorsWithSummary = vendors.map(vendor => ({
    ...vendor,
    availabilitySummary: calculateAvailabilitySummary(vendor),
    pricingSummary: calculatePricingSummary(vendor)
  }));

  res.status(200).json({
    status: 'success',
    results: vendors.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    data: vendorsWithSummary
  });
});

// Get vendor suggestions based on user preferences and history
exports.getVendorSuggestions = catchAsync(async (req, res) => {
  const { userId, eventType, budget, location } = req.query;

  // Build suggestion criteria based on user preferences
  const filter = {
    status: 'Active',
    isVerified: true,
    'priceRange.min': { $lte: Number(budget) },
    'location.city': location
  };

  // Find vendors matching criteria
  const vendors = await Vendor.find(filter)
    .sort({ averageRating: -1, totalReviews: -1 })
    .limit(10)
    .select('businessName serviceCategory priceRange averageRating totalReviews location')
    .lean();

  res.status(200).json({
    status: 'success',
    results: vendors.length,
    data: vendors
  });
});

// Get trending vendors
exports.getTrendingVendors = catchAsync(async (req, res) => {
  const { city, category } = req.query;

  const filter = {
    status: 'Active',
    isVerified: true
  };

  if (city) filter['location.city'] = city;
  if (category) filter.serviceCategory = category;

  const vendors = await Vendor.find(filter)
    .sort({ views: -1, averageRating: -1 })
    .limit(8)
    .select('businessName serviceCategory priceRange averageRating totalReviews location profileImage')
    .lean();

  res.status(200).json({
    status: 'success',
    results: vendors.length,
    data: vendors
  });
});

// Helper function to calculate availability summary
const calculateAvailabilitySummary = (vendor) => {
  const now = new Date();
  const nextThreeMonths = new Date(now.setMonth(now.getMonth() + 3));

  const availableDates = vendor.availability.filter(a => 
    !a.isFullyBooked && 
    a.date >= now && 
    a.date <= nextThreeMonths
  ).length;

  return {
    availableDates,
    nextAvailable: vendor.availability.find(a => !a.isFullyBooked && a.date >= now)?.date
  };
};

// Helper function to calculate pricing summary
const calculatePricingSummary = (vendor) => {
  const packages = vendor.packages || [];
  return {
    minPrice: vendor.priceRange.min,
    maxPrice: vendor.priceRange.max,
    popularPackage: packages.find(p => p.isPopular),
    packagesCount: packages.length
  };
};