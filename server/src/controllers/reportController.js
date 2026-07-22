/**
 * @file reportController.js
 * @description Controller for aggregating system statistics for Chart.js analytics dashboard.
 */

const prisma = require('../config/db');

/**
 * Get aggregated reporting and analytics metrics for dashboard.
 * @route GET /api/reports/dashboard
 * @access ADMIN, AGENT, CUSTOMER
 */
const getDashboardMetrics = async (req, res, next) => {
  try {
    const isCustomer = req.user.role === 'CUSTOMER';
    let customerFilter = {};

    if (isCustomer) {
      const customer = await prisma.customer.findFirst({
        where: { OR: [{ userId: req.user.id }, { email: req.user.email.toLowerCase() }] },
      });
      customerFilter = { customerId: customer ? customer.id : 'non-existent' };
    }

    // 1. Policy Status Counts (ACTIVE, EXPIRED, CANCELLED)
    const policyStatusGroup = await prisma.policy.groupBy({
      by: ['status'],
      where: customerFilter,
      _count: { id: true },
    });

    const policyStats = {
      ACTIVE: 0,
      EXPIRED: 0,
      CANCELLED: 0,
    };
    policyStatusGroup.forEach((group) => {
      policyStats[group.status] = group._count.id;
    });

    // 2. Claim Statistics (PENDING, APPROVED, REJECTED)
    const claimStatusGroup = await prisma.claim.groupBy({
      by: ['status'],
      where: isCustomer ? { policy: customerFilter } : {},
      _count: { id: true },
      _sum: { claimAmount: true },
    });

    const claimStats = {
      PENDING: { count: 0, amount: 0 },
      APPROVED: { count: 0, amount: 0 },
      REJECTED: { count: 0, amount: 0 },
    };
    claimStatusGroup.forEach((group) => {
      claimStats[group.status] = {
        count: group._count.id,
        amount: group._sum.claimAmount || 0,
      };
    });

    // 3. Monthly Premium Collections (PAID premiums)
    const paidPremiums = await prisma.premium.findMany({
      where: {
        paymentStatus: 'PAID',
        ...(isCustomer ? { policy: customerFilter } : {}),
      },
      select: {
        amount: true,
        paymentDate: true,
      },
    });

    // Aggregate premiums by month (e.g. "Jan", "Feb", ...)
    const monthlyPremiumsMap = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Pre-fill 6 months timeline
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      monthlyPremiumsMap[monthLabel] = 0;
    }

    paidPremiums.forEach((p) => {
      if (p.paymentDate) {
        const date = new Date(p.paymentDate);
        const label = `${months[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
        if (monthlyPremiumsMap[label] !== undefined) {
          monthlyPremiumsMap[label] += p.amount;
        }
      }
    });

    const monthlyPremiums = Object.keys(monthlyPremiumsMap).map((label) => ({
      month: label,
      amount: monthlyPremiumsMap[label],
    }));

    // 4. Customer Growth Timeline
    let customerGrowth = [];
    if (!isCustomer) {
      const customers = await prisma.customer.findMany({
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

      const customerMap = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
        customerMap[monthLabel] = 0;
      }

      customers.forEach((c) => {
        const date = new Date(c.createdAt);
        const label = `${months[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
        if (customerMap[label] !== undefined) {
          customerMap[label] += 1;
        }
      });

      customerGrowth = Object.keys(customerMap).map((label) => ({
        month: label,
        count: customerMap[label],
      }));
    }

    // 5. Summary KPI Cards
    const totalCustomersCount = isCustomer ? 1 : await prisma.customer.count();
    const totalActivePoliciesCount = policyStats.ACTIVE;

    const totalCollectedObj = await prisma.premium.aggregate({
      _sum: { amount: true },
      where: {
        paymentStatus: 'PAID',
        ...(isCustomer ? { policy: customerFilter } : {}),
      },
    });
    const totalPremiumsCollected = totalCollectedObj._sum.amount || 0;

    return res.status(200).json({
      success: true,
      message: 'Dashboard metrics retrieved successfully',
      data: {
        summary: {
          totalCustomers: totalCustomersCount,
          activePolicies: totalActivePoliciesCount,
          totalCollected: totalPremiumsCollected,
          pendingClaims: claimStats.PENDING.count,
        },
        charts: {
          policyStatus: policyStats,
          claimStats,
          monthlyPremiums,
          customerGrowth,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
};
