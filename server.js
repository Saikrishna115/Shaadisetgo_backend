const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();

// --- CORS Configuration ---
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://shaadisetgo-frontend.vercel.app',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
  ],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// --- MongoDB Connection ---
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// --- Routes ---
app.get('/', (req, res) => {
  res.send('Welcome to ShaadiSetGo API');
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const bookingRoutes = require('./routes/booking');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/bookings', bookingRoutes);

// --- Start Server ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
