/**
 * @file claimRoutes.js
 * @description Express routes for Claim Management.
 */

const express = require('express');
const router = express.Router();

const claimController = require('../controllers/claimController');
const validate = require('../middleware/validate');
const { createClaimSchema, reviewClaimSchema } = require('../validators/claimValidator');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post(
  '/',
  authorize('ADMIN', 'AGENT', 'CUSTOMER'),
  validate(createClaimSchema),
  claimController.createClaim
);

router.get(
  '/',
  authorize('ADMIN', 'AGENT', 'CUSTOMER'),
  claimController.getClaims
);

router.get(
  '/:id',
  authorize('ADMIN', 'AGENT', 'CUSTOMER'),
  claimController.getClaimById
);

router.put(
  '/:id/review',
  authorize('ADMIN', 'AGENT'),
  validate(reviewClaimSchema),
  claimController.reviewClaim
);

module.exports = router;
