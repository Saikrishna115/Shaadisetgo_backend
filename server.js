const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load environment variables from .env file
dotenv.config();

// Verify required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName] && !process.env[varName.replace('MONGODB_', 'MONGO_')]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

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
  exposedHeaders: ['Content-Length', 'Content-Type'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// --- MongoDB Connection ---
const startServer = async () => {
  try {
    await connectDB();
    console.log('Database connection established');

    // Monitor MongoDB connection
    mongoose.connection.on('error', err => {
      console.error('MongoDB error:', {
        message: err.message,
        code: err.code,
        stack: err.stack
      });
    });

    mongoose.connection.on('disconnected', () => {
      console.error('MongoDB disconnected. Attempting to reconnect...');
    });

    // --- Routes ---
    app.get('/', (req, res) => {
      res.send('Welcome to ShaadiSetGo API');
    });

    app.get('/health', (req, res) => {
      const dbState = mongoose.connection.readyState;
      res.json({ 
        status: 'healthy',
        database: {
          state: dbState,
          connected: dbState === 1,
          url: process.env.NODE_ENV === 'development' ? mongoose.connection.host : undefined
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
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
    app.use('/api/favorites', require('./routes/favorite'));

    // --- Error Handling Middleware ---
    // Handle 404 errors
    app.use((req, res, next) => {
      const error = new Error('Not Found');
      error.status = 404;
      next(error);
    });

    // Global error handler
    app.use((err, req, res, next) => {
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        status: err.status || 500,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
        timestamp: new Date().toISOString()
      });

      // Don't expose stack trace in production
      const error = {
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        status: err.status || 500,
        path: req.path,
        timestamp: new Date().toISOString()
      };

      res.status(error.status).json(error);
    });

    // --- Start Server ---
    const PORT = process.env.PORT || 10000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    process.exit(1);
  }
};

// Start the server
startServer();
