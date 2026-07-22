/**
 * @file cronService.js
 * @description Background cron job to check and update policy status and overdue premiums.
 */

const cron = require('node-cron');
const prisma = require('../config/db');

/**
 * Initialize background cron jobs.
 */
const initCronJobs = () => {
  // Run every hour to check policy expirations and overdue premiums
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running scheduled policy expiration and overdue check...');
    try {
      const now = new Date();

      // Update active policies that passed end date to EXPIRED
      const expiredCount = await prisma.policy.updateMany({
        where: {
          status: 'ACTIVE',
          endDate: { lt: now },
        },
        data: {
          status: 'EXPIRED',
        },
      });

      // Update pending premiums that passed due date to OVERDUE
      const overdueCount = await prisma.premium.updateMany({
        where: {
          paymentStatus: 'PENDING',
          dueDate: { lt: now },
        },
        data: {
          paymentStatus: 'OVERDUE',
        },
      });

      console.log(`[Cron Complete] Expired Policies: ${expiredCount.count}, Overdue Premiums: ${overdueCount.count}`);
    } catch (error) {
      console.error('[Cron Error]', error);
    }
  });
};

module.exports = { initCronJobs };
