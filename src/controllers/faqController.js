const FAQ = require('../models/FAQ');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Get all FAQs
exports.getAllFAQs = catchAsync(async (req, res) => {
  const faqs = await FAQ.find({ isActive: true })
    .sort({ category: 1, order: 1 })
    .lean();

  // Group FAQs by category
  const groupedFaqs = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {});

  res.status(200).json({
    status: 'success',
    data: groupedFaqs
  });
});

// Get FAQ by ID
exports.getFAQById = catchAsync(async (req, res, next) => {
  const faq = await FAQ.findById(req.params.id);

  if (!faq) {
    return next(new AppError('FAQ not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: faq
  });
});

// Create new FAQ
exports.createFAQ = catchAsync(async (req, res) => {
  const newFAQ = await FAQ.create(req.body);

  res.status(201).json({
    status: 'success',
    data: newFAQ
  });
});

// Update FAQ
exports.updateFAQ = catchAsync(async (req, res, next) => {
  const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!faq) {
    return next(new AppError('FAQ not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: faq
  });
});

// Delete FAQ (soft delete by setting isActive to false)
exports.deleteFAQ = catchAsync(async (req, res, next) => {
  const faq = await FAQ.findByIdAndUpdate(req.params.id, { isActive: false });

  if (!faq) {
    return next(new AppError('FAQ not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Search FAQs
exports.searchFAQs = catchAsync(async (req, res) => {
  const { query } = req.query;
  
  const faqs = await FAQ.find({
    isActive: true,
    $or: [
      { question: { $regex: query, $options: 'i' } },
      { answer: { $regex: query, $options: 'i' } }
    ]
  }).sort({ category: 1, order: 1 });

  res.status(200).json({
    status: 'success',
    results: faqs.length,
    data: faqs
  });
});

// Update FAQ order within category
exports.updateFAQOrder = catchAsync(async (req, res) => {
  const { faqs } = req.body; // Array of { id, order }

  const updateOperations = faqs.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { order } }
    }
  }));

  await FAQ.bulkWrite(updateOperations);

  res.status(200).json({
    status: 'success',
    message: 'FAQ order updated successfully'
  });
});