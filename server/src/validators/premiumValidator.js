/**
 * @file premiumValidator.js
 * @description Zod validation schemas for Premium tracking endpoints.
 */

const { z } = require('zod');

const payPremiumSchema = z.object({
  paymentMethod: z.string().optional().default('CREDIT_CARD'),
  transactionId: z.string().optional(),
});

module.exports = {
  payPremiumSchema,
};
