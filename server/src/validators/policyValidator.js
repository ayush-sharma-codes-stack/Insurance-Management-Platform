/**
 * @file policyValidator.js
 * @description Zod validation schemas for Policy Management endpoints.
 */

const { z } = require('zod');

const createPolicySchema = z.object({
  customerId: z.string().uuid('Valid customer ID is required'),
  agentId: z.string().uuid('Valid agent ID is required'),
  policyType: z.string().min(2, 'Policy type is required (e.g. Health, Life, Auto, Home)'),
  premiumAmount: z.number().positive('Premium amount must be greater than 0'),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date' }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date' }),
});

const renewPolicySchema = z.object({
  extensionMonths: z.number().int().positive().default(12),
  newPremiumAmount: z.number().positive().optional(),
});

module.exports = {
  createPolicySchema,
  renewPolicySchema,
};
