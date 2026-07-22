/**
 * @file policyRoutes.js
 * @description Express routes for Policy Management.
 */

const express = require('express');
const router = express.Router();

const policyController = require('../controllers/policyController');
const validate = require('../middleware/validate');
const { createPolicySchema, renewPolicySchema } = require('../validators/policyValidator');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post(
  '/',
  authorize('ADMIN', 'AGENT'),
  validate(createPolicySchema),
  policyController.createPolicy
);

router.get(
  '/',
  authorize('ADMIN', 'AGENT', 'CUSTOMER'),
  policyController.getPolicies
);

router.get(
  '/expiring-soon',
  authorize('ADMIN', 'AGENT', 'CUSTOMER'),
  policyController.getExpiringSoonPolicies
);

router.get(
  '/:id',
  authorize('ADMIN', 'AGENT', 'CUSTOMER'),
  policyController.getPolicyById
);

router.put(
  '/:id/renew',
  authorize('ADMIN', 'AGENT'),
  validate(renewPolicySchema),
  policyController.renewPolicy
);

router.put(
  '/:id/cancel',
  authorize('ADMIN', 'AGENT'),
  policyController.cancelPolicy
);

module.exports = router;
