/**
 * @file reportRoutes.js
 * @description Express routes for Dashboard Reports & Analytics.
 */

const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/dashboard', reportController.getDashboardMetrics);

module.exports = router;
