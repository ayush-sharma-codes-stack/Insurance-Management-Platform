/**
 * @file customerValidator.js
 * @description Zod validation schemas for Customer management endpoints.
 */

const { z } = require('zod');

const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address format'),
  phone: z.string().min(5, 'Phone number must be at least 5 digits'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format for date of birth (ISO YYYY-MM-DD required)',
  }),
  userId: z.string().uuid().optional().nullable(),
});

const updateCustomerSchema = createCustomerSchema.partial();

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
};
