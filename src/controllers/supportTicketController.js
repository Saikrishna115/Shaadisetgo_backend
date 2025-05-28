const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendEmail } = require('../utils/email');

// Create new support ticket
exports.createTicket = catchAsync(async (req, res) => {
  const ticket = await SupportTicket.create({
    ...req.body,
    userId: req.user._id
  });

  // Send email notification
  await sendEmail({
    email: req.user.email,
    subject: 'Support Ticket Created',
    template: 'ticketCreated',
    data: {
      ticketId: ticket._id,
      subject: ticket.subject
    }
  });

  res.status(201).json({
    status: 'success',
    data: ticket
  });
});

// Get all tickets (with filtering)
exports.getAllTickets = catchAsync(async (req, res) => {
  const { status, priority, category } = req.query;
  const filter = {};

  // Apply filters if provided
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;

  // Add user filter based on role
  if (req.user.role === 'user') {
    filter.userId = req.user._id;
  } else if (req.user.role === 'support') {
    filter.assignedTo = req.user._id;
  }

  const tickets = await SupportTicket.find(filter)
    .populate('userId', 'name email')
    .populate('assignedTo', 'name')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: tickets.length,
    data: tickets
  });
});

// Get ticket by ID
exports.getTicketById = catchAsync(async (req, res, next) => {
  const ticket = await SupportTicket.findById(req.params.id)
    .populate('userId', 'name email')
    .populate('assignedTo', 'name')
    .populate('messages.sender', 'name');

  if (!ticket) {
    return next(new AppError('Ticket not found', 404));
  }

  // Check if user has access to this ticket
  if (req.user.role === 'user' && ticket.userId.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to view this ticket', 403));
  }

  res.status(200).json({
    status: 'success',
    data: ticket
  });
});

// Update ticket
exports.updateTicket = catchAsync(async (req, res, next) => {
  const ticket = await SupportTicket.findById(req.params.id);

  if (!ticket) {
    return next(new AppError('Ticket not found', 404));
  }

  // Only allow status updates from support staff
  if (req.body.status && req.user.role !== 'admin' && req.user.role !== 'support') {
    return next(new AppError('Not authorized to update ticket status', 403));
  }

  Object.assign(ticket, req.body);
  await ticket.save();

  res.status(200).json({
    status: 'success',
    data: ticket
  });
});

// Add message to ticket
exports.addMessage = catchAsync(async (req, res, next) => {
  const ticket = await SupportTicket.findById(req.params.id);

  if (!ticket) {
    return next(new AppError('Ticket not found', 404));
  }

  ticket.messages.push({
    sender: req.user._id,
    message: req.body.message
  });

  await ticket.save();

  // Notify the other party
  const recipientId = req.user._id.equals(ticket.userId) ? ticket.assignedTo : ticket.userId;
  if (recipientId) {
    const recipient = await User.findById(recipientId);
    await sendEmail({
      email: recipient.email,
      subject: `New Message on Ticket #${ticket._id}`,
      template: 'ticketMessage',
      data: {
        ticketId: ticket._id,
        subject: ticket.subject,
        message: req.body.message
      }
    });
  }

  res.status(200).json({
    status: 'success',
    data: ticket
  });
});

// Assign ticket to support staff
exports.assignTicket = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'support') {
    return next(new AppError('Not authorized to assign tickets', 403));
  }

  const ticket = await SupportTicket.findByIdAndUpdate(
    req.params.id,
    { assignedTo: req.body.assignedTo },
    { new: true }
  );

  if (!ticket) {
    return next(new AppError('Ticket not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: ticket
  });
});

// Close ticket
exports.closeTicket = catchAsync(async (req, res, next) => {
  const ticket = await SupportTicket.findById(req.params.id);

  if (!ticket) {
    return next(new AppError('Ticket not found', 404));
  }

  if (req.user.role !== 'admin' && 
      req.user.role !== 'support' && 
      ticket.userId.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to close this ticket', 403));
  }

  ticket.status = 'Closed';
  ticket.resolvedAt = Date.now();
  await ticket.save();

  res.status(200).json({
    status: 'success',
    data: ticket
  });
});