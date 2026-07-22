/**
 * @file customerRoutes.js
 * @description Express routes for Customer Management.
 */

const express = require('express');
const router = express.Router();

const customerController = require('../controllers/customerController');
const validate = require('../middleware/validate');
const { createCustomerSchema, updateCustomerSchema } = require('../validators/customerValidator');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post(
  '/',
  authorize('ADMIN', 'AGENT'),
  validate(createCustomerSchema),
  customerController.createCustomer
);

router.get(
  '/',
  authorize('ADMIN', 'AGENT', 'CUSTOMER'),
  customerController.getCustomers
);

router.get(
  '/:id',
  authorize('ADMIN', 'AGENT', 'CUSTOMER'),
  customerController.getCustomerById
);

router.put(
  '/:id',
  authorize('ADMIN', 'AGENT', 'CUSTOMER'),
  validate(updateCustomerSchema),
  customerController.updateCustomer
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  customerController.deleteCustomer
);

module.exports = router;
