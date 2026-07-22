/**
 * @file claimValidator.js
 * @description Zod validation schemas for Claim Management endpoints.
 */

const { z } = require('zod');

const createClaimSchema = z.object({
  policyId: z.string().uuid('Valid policy ID is required'),
  claimAmount: z.number().positive('Claim amount must be greater than 0'),
  reason: z.string().min(5, 'Reason for claim must be at least 5 characters long'),
});

const reviewClaimSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: 'Status must be either APPROVED or REJECTED' }),
  }),
  reviewNotes: z.string().min(2, 'Review notes are required'),
});

module.exports = {
  createClaimSchema,
  reviewClaimSchema,
};
