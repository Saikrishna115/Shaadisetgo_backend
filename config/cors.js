const corsOptions = {
  origin: (origin, callback) => {
    // Add your frontend domain(s) in production
    const allowedOrigins = [
      'http://localhost:3000',  // React development server
      'http://localhost:5173',  // Vite development server
      process.env.FRONTEND_URL, // Production frontend URL
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
    'Origin'
  ],
  exposedHeaders: [           // Headers exposed to the client
    'Content-Range',
    'X-Content-Range'
  ],
  maxAge: 86400,             // Cache preflight requests for 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

module.exports = corsOptions; 