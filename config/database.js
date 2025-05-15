const mongoose = require('mongoose');

// Database connection configuration with performance optimizations
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Connection pool settings
      maxPoolSize: 100, // Maximum number of connections in the pool
      minPoolSize: 5,   // Minimum number of connections in the pool
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4,        // Use IPv4, skip trying IPv6
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds of selection retries
      heartbeatFrequencyMS: 10000,    // Check connection health every 10 seconds
      // Read/Write concern settings
      w: 'majority',    // Write concern - wait for majority of nodes
      readPreference: 'primaryPreferred', // Read from primary if available
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
      console.error('MongoDB connection error:', err);
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
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;