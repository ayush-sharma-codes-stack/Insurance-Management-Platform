/**
 * @file premiumController.js
 * @description Controllers for Premium payment recording, overdue detection, history, and PDF receipt download.
 */

const prisma = require('../config/db');
const { generateReceiptPDF } = require('../services/pdfService');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');

/**
 * Record payment for a Premium record.
 * @route PUT /api/premiums/:id/pay
 * @access ADMIN, AGENT, CUSTOMER
 */
const recordPayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const premium = await prisma.premium.findUnique({
      where: { id },
      include: {
        policy: {
          include: { customer: true },
        },
      },
    });

    if (!premium) {
      return res.status(404).json({
        success: false,
        message: 'Premium record not found',
        error: 'NotFound',
      });
    }

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { OR: [{ userId: req.user.id }, { email: req.user.email.toLowerCase() }] },
      });
      if (!customer || premium.policy.customerId !== customer.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only pay for your own policy premiums',
          error: 'Forbidden',
        });
      }
    }

    if (premium.paymentStatus === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'This premium is already marked as PAID',
        error: 'BadRequest',
      });
    }

    const updatedPremium = await prisma.premium.update({
      where: { id },
      data: {
        paymentStatus: 'PAID',
        paymentDate: new Date(),
      },
      include: {
        policy: {
          include: { customer: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: updatedPremium,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get overdue premiums where dueDate < TODAY and paymentStatus != PAID.
 * @route GET /api/premiums/overdue
 * @access ADMIN, AGENT, CUSTOMER
 */
const getOverduePremiums = async (req, res, next) => {
  try {
    const now = new Date();
    const where = {
      dueDate: { lt: now },
      paymentStatus: { in: ['PENDING', 'OVERDUE'] },
    };

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { OR: [{ userId: req.user.id }, { email: req.user.email.toLowerCase() }] },
      });
      where.policy = { customerId: customer ? customer.id : 'non-existent' };
    }

    const overduePremiums = await prisma.premium.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        policy: {
          include: {
            customer: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Overdue premiums retrieved successfully',
      data: overduePremiums,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment history by policy ID.
 * @route GET /api/premiums/policy/:policyId
 * @access ADMIN, AGENT, CUSTOMER
 */
const getPolicyPremiums = async (req, res, next) => {
  try {
    const { policyId } = req.params;

    const policy = await prisma.policy.findUnique({ where: { id: policyId } });
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found',
        error: 'NotFound',
      });
    }

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { OR: [{ userId: req.user.id }, { email: req.user.email.toLowerCase() }] },
      });
      if (!customer || policy.customerId !== customer.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You cannot view payment history for this policy',
          error: 'Forbidden',
        });
      }
    }

    const premiums = await prisma.premium.findMany({
      where: { policyId },
      orderBy: { dueDate: 'desc' },
      include: {
        policy: {
          select: { policyNumber: true, policyType: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Policy payment history retrieved',
      data: premiums,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all premiums with pagination & status filters.
 * @route GET /api/premiums
 * @access ADMIN, AGENT, CUSTOMER
 */
const getAllPremiums = async (req, res, next) => {
  try {
    const { page, limit, skip, search, sortBy, order } = getPaginationParams(req);
    const { paymentStatus } = req.query;

    const where = {
      ...(paymentStatus && { paymentStatus: String(paymentStatus).toUpperCase() }),
      ...(search && {
        policy: {
          OR: [
            { policyNumber: { contains: search, mode: 'insensitive' } },
            { customer: { name: { contains: search, mode: 'insensitive' } } },
          ],
        },
      }),
    };

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { OR: [{ userId: req.user.id }, { email: req.user.email.toLowerCase() }] },
      });
      where.policy = { customerId: customer ? customer.id : 'non-existent' };
    }

    const [premiums, totalCount] = await Promise.all([
      prisma.premium.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy === 'createdAt' ? 'createdAt' : sortBy]: order },
        include: {
          policy: {
            include: {
              customer: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
      prisma.premium.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Premiums retrieved successfully',
      data: formatPaginatedResponse(premiums, totalCount, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate & Download PDF Payment Receipt.
 * @route GET /api/premiums/:id/receipt
 * @access ADMIN, AGENT, CUSTOMER
 */
const downloadReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;

    const premium = await prisma.premium.findUnique({
      where: { id },
      include: {
        policy: {
          include: { customer: true },
        },
      },
    });

    if (!premium) {
      return res.status(404).json({
        success: false,
        message: 'Premium record not found',
        error: 'NotFound',
      });
    }

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { OR: [{ userId: req.user.id }, { email: req.user.email.toLowerCase() }] },
      });
      if (!customer || premium.policy.customerId !== customer.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You cannot download receipts for other policies',
          error: 'Forbidden',
        });
      }
    }

    generateReceiptPDF(premium, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordPayment,
  getOverduePremiums,
  getPolicyPremiums,
  getAllPremiums,
  downloadReceipt,
};
