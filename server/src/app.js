/**
 * @file app.js
 * @description Express application setup with middlewares and routing.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const healthRoutes = require('./routes/health');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security and utility middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
];

if (process.env.CLIENT_URL) {
  const origins = process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/$/, ''));
  allowedOrigins.push(...origins);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const sanitizedOrigin = origin.replace(/\/$/, '');

      if (allowedOrigins.includes(sanitizedOrigin)) {
        return callback(null, true);
      }

      if (/\.vercel\.app$/.test(sanitizedOrigin)) {
        return callback(null, true);
      }

      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(sanitizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy error: Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static directory for uploaded documents
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check route
app.use('/api/health', healthRoutes);

// Auth routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Customer routes
const customerRoutes = require('./routes/customerRoutes');
app.use('/api/customers', customerRoutes);

// Policy routes
const policyRoutes = require('./routes/policyRoutes');
app.use('/api/policies', policyRoutes);

// Premium routes
const premiumRoutes = require('./routes/premiumRoutes');
app.use('/api/premiums', premiumRoutes);

// Claim routes
const claimRoutes = require('./routes/claimRoutes');
app.use('/api/claims', claimRoutes);

// Document routes
const documentRoutes = require('./routes/documentRoutes');
app.use('/api/documents', documentRoutes);

// Report routes
const reportRoutes = require('./routes/reportRoutes');
app.use('/api/reports', reportRoutes);

// Initialize background cron jobs
const { initCronJobs } = require('./services/cronService');
initCronJobs();

// 404 handler
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
    error: 'Not Found',
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
