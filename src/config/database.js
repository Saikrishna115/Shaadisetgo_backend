const mongoose = require('mongoose');

// Database connection configuration with performance optimizations
const connectDB = async () => {
  try {
    // Check for both possible environment variable names
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MongoDB connection string not found. Please set MONGODB_URI or MONGO_URI in environment variables.');
    }

    console.log('Attempting to connect to MongoDB...');

    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Connection pool settings
      maxPoolSize: 100,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      family: 4,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
      // Read/Write concern settings
      w: 'majority',
      readPreference: 'primaryPreferred',
      // Performance monitoring
      monitorCommands: true
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Log when MongoDB connection pool is ready
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connection pool is ready');
    });

    // Handle connection errors
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', {
        message: err.message,
        stack: err.stack,
        code: err.code
      });
    });

    // Handle disconnection
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error during MongoDB shutdown:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('MongoDB connection error:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    throw error; // Re-throw to be handled by the caller
  }
};

module.exports = connectDB;