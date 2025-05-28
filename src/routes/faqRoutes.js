const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  searchFAQs,
  updateFAQOrder
} = require('../controllers/faqController');

// Public routes
router.get('/', getAllFAQs);
router.get('/search', searchFAQs);
router.get('/:id', getFAQById);

// Protected admin routes
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', createFAQ);
router.patch('/:id', updateFAQ);
router.delete('/:id', deleteFAQ);
router.patch('/order/update', updateFAQOrder);

module.exports = router;