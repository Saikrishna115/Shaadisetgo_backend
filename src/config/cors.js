const corsOptions = {
  origin: (origin, callback) => {
    // Add your frontend domain(s) in production
    const allowedOrigins = [
      'http://localhost:3000',  // React development server
      'http://localhost:5173',  // Vite development server
      'https://shaadisetgo-frontend.vercel.app', // Production frontend URL
      'https://shaadisetgo-backend.onrender.com', // Production backend URL
      process.env.FRONTEND_URL, // Backup production frontend URL
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,           // Allow credentials (cookies)
  methods: [                  // Allowed HTTP methods
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
    'OPTIONS'
  ],
  allowedHeaders: [           // Allowed headers
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'cache-control',
    'pragma',
    'Access-Control-Allow-Origin'
  ],
  exposedHeaders: [           // Headers exposed to the client
    'Content-Range',
    'X-Content-Range',
    'Access-Control-Allow-Origin'
  ],
  maxAge: 86400,             // Cache preflight requests for 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

module.exports = corsOptions;