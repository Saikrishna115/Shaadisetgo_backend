const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const vendorRoutes = require('./routes/vendor');
const bookingRoutes = require('./routes/booking');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'https://shaadisetgo-frontend.vercel.app', 'https://shaadisetgo-backend.onrender.com'],
  credentials: true
}));

// Root route handler
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ShaadiSetGo API' });
});
app.use('/api/auth', authRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/admin', adminRoutes);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
}).catch(err => console.error(err));
