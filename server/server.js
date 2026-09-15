const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Environment Validation
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET environment variable is missing. Authentication may be insecure.');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Dynamic CORS configuration
const defaultOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
let allowedOrigins;

if (process.env.CORS_ORIGIN) {
  if (process.env.CORS_ORIGIN === '*') {
    allowedOrigins = '*';
  } else {
    const customOrigins = process.env.CORS_ORIGIN.split(',').map((o) => o.trim().replace(/\/$/, ''));
    allowedOrigins = Array.from(new Set([...customOrigins, ...defaultOrigins]));
  }
} else {
  allowedOrigins = defaultOrigins;
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check handler
const getHealthStatus = (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const isHealthy = dbState === 1 || dbState === 2;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'UP' : 'DOWN',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: dbStatusMap[dbState] || 'unknown',
  });
};

// Health endpoints
app.get('/health', getHealthStatus);
app.get('/api/health', getHealthStatus);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/admin', adminRoutes);

// Serve static files from client dist in production if frontend is co-located
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDistPath));

  // Handle React routing for co-located deployments
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
      if (err) {
        next();
      }
    });
  });
}

// Error handler (must be after routes)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
