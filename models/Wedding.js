const mongoose = require('mongoose');

const weddingSchema = new mongoose.Schema({
  couple: {
    bride: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true }
    },
    groom: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true }
    }
  },
  date: {
    type: Date,
    required: true,
    index: true // Index for date-based queries
  },
  venue: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Index for organizer lookups
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Index for customer lookups
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
    index: true // Index for status-based filtering
  },
  packages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package'
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed'],
    default: 'pending',
    index: true // Index for payment status queries
  }
}, {
  timestamps: true
});

// Compound index for date range queries with status
weddingSchema.index({ date: 1, status: 1 });

// Compound index for organizer with date
weddingSchema.index({ organizer: 1, date: 1 });

// Add lean queries helper
weddingSchema.statics.findByDateRange = async function(startDate, endDate, options = {}) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  })
  .lean()
  .exec();
};

// Efficient pagination helper
weddingSchema.statics.paginateWeddings = async function(query = {}, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    this.find(query)
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);

  return {
    data,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

module.exports = mongoose.model('Wedding', weddingSchema);