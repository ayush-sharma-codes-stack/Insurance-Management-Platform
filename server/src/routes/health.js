/**
 * @file health.js
 * @description Health check API route.
 */

const express = require('express');
const router = express.Router();

/**
 * @route GET /api/health
 * @desc Returns health status of the API server
 * @access Public
 */
router.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Insurance Management Platform API is running healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
