/**
 * @file generatePolicyNumber.js
 * @description Helper utility to generate unique policy numbers.
 */

const crypto = require('crypto');

/**
 * Generate a unique policy number string: POL-YYYYMMDD-XXXX
 * @returns {string} Unique policy number
 */
const generatePolicyNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `POL-${dateStr}-${randomSuffix}`;
};

module.exports = generatePolicyNumber;
