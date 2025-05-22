const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  updatePassword,
  updatePreferences,
  deleteAccount
} = require('../controllers/userController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  }
});

// Protected routes
router.use(protect);

router
  .route('/profile')
  .get(getProfile)
  .patch(upload.single('profilePicture'), updateProfile);

router.patch('/update-password', updatePassword);
router.patch('/update-preferences', updatePreferences);
router.delete('/delete-account', deleteAccount);

module.exports = router;
