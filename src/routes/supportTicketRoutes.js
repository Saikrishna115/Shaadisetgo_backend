const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  addMessage,
  assignTicket,
  closeTicket
} = require('../controllers/supportTicketController');

// All routes require authentication
router.use(protect);

// Routes accessible by all authenticated users
router.post('/', createTicket);
router.get('/', getAllTickets);
router.get('/:id', getTicketById);
router.post('/:id/messages', addMessage);

// Routes for support staff and admins only
router.use(restrictTo('admin', 'support'));
router.patch('/:id', updateTicket);
router.patch('/:id/assign', assignTicket);

// Route for closing tickets (accessible by ticket owner, support staff, and admins)
router.patch('/:id/close', closeTicket);

module.exports = router;