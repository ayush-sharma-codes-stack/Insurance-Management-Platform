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

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

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
