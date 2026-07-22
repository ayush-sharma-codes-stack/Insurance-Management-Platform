/**
 * @file policyController.js
 * @description Controllers for Policy creation, listing, renewal, cancellation, and expiry alerts.
 */

const prisma = require('../config/db');
const generatePolicyNumber = require('../utils/generatePolicyNumber');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');

/**
 * Create a new Policy.
 * @route POST /api/policies
 * @access ADMIN, AGENT
 */
const createPolicy = async (req, res, next) => {
  try {
    const { customerId, agentId, policyType, premiumAmount, startDate, endDate } = req.body;

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        error: 'NotFound',
      });
    }

    const agent = await prisma.user.findUnique({ where: { id: agentId } });
    if (!agent || (agent.role !== 'AGENT' && agent.role !== 'ADMIN')) {
      return res.status(400).json({
        success: false,
        message: 'Agent ID must belong to an AGENT or ADMIN user',
        error: 'BadRequest',
      });
    }

    const policyNumber = generatePolicyNumber();

    const policy = await prisma.policy.create({
      data: {
        customerId,
        agentId,
        policyType,
        policyNumber,
        premiumAmount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'ACTIVE',
        premiums: {
          create: {
            amount: premiumAmount,
            paymentStatus: 'PENDING',
            dueDate: new Date(startDate),
          },
        },
      },
      include: {
        customer: true,
        agent: { select: { id: true, name: true, email: true } },
        premiums: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Policy created successfully',
      data: policy,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get paginated policies with status filters.
 * @route GET /api/policies
 * @access ADMIN, AGENT, CUSTOMER
 */
const getPolicies = async (req, res, next) => {
  try {
    const { page, limit, skip, search, sortBy, order } = getPaginationParams(req);
    const { status, policyType } = req.query;

    const where = {
      ...(status && { status: String(status).toUpperCase() }),
      ...(policyType && { policyType: { equals: String(policyType), mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { policyNumber: { contains: search, mode: 'insensitive' } },
          { policyType: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    // If logged in as CUSTOMER, only show customer's policies
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: {
          OR: [{ userId: req.user.id }, { email: req.user.email.toLowerCase() }],
        },
      });
      where.customerId = customer ? customer.id : 'non-existent';
    }

    const [policies, totalCount] = await Promise.all([
      prisma.policy.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy === 'createdAt' ? 'createdAt' : sortBy]: order },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          agent: { select: { id: true, name: true } },
          _count: { select: { claims: true, premiums: true } },
        },
      }),
      prisma.policy.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Policies retrieved successfully',
      data: formatPaginatedResponse(policies, totalCount, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Policy details by ID.
 * @route GET /api/policies/:id
 * @access ADMIN, AGENT, CUSTOMER
 */
const getPolicyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const policy = await prisma.policy.findUnique({
      where: { id },
      include: {
        customer: true,
        agent: { select: { id: true, name: true, email: true } },
        premiums: { orderBy: { dueDate: 'desc' } },
        claims: { orderBy: { submissionDate: 'desc' } },
      },
    });

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
          message: 'Forbidden: You cannot access this policy',
          error: 'Forbidden',
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Policy retrieved successfully',
      data: policy,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Renew Policy by extending end date and generating a new pending premium.
 * @route PUT /api/policies/:id/renew
 * @access ADMIN, AGENT
 */
const renewPolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const extensionMonths = req.body.extensionMonths || 12;
    const newPremiumAmount = req.body.newPremiumAmount;

    const policy = await prisma.policy.findUnique({ where: { id } });
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found',
        error: 'NotFound',
      });
    }

    const currentEndDate = new Date(policy.endDate);
    const baseDate = currentEndDate > new Date() ? currentEndDate : new Date();
    const updatedEndDate = new Date(baseDate);
    updatedEndDate.setMonth(updatedEndDate.getMonth() + extensionMonths);

    const renewalAmount = newPremiumAmount || policy.premiumAmount;

    const updatedPolicy = await prisma.policy.update({
      where: { id },
      data: {
        endDate: updatedEndDate,
        status: 'ACTIVE',
        ...(newPremiumAmount && { premiumAmount: newPremiumAmount }),
        premiums: {
          create: {
            amount: renewalAmount,
            paymentStatus: 'PENDING',
            dueDate: baseDate,
          },
        },
      },
      include: {
        customer: true,
        premiums: { orderBy: { dueDate: 'desc' } },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Policy renewed successfully',
      data: updatedPolicy,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel Policy (soft update status to CANCELLED).
 * @route PUT /api/policies/:id/cancel
 * @access ADMIN, AGENT
 */
const cancelPolicy = async (req, res, next) => {
  try {
    const { id } = req.params;

    const policy = await prisma.policy.findUnique({ where: { id } });
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found',
        error: 'NotFound',
      });
    }

    const cancelledPolicy = await prisma.policy.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return res.status(200).json({
      success: true,
      message: 'Policy cancelled successfully',
      data: cancelledPolicy,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get policies expiring within the next 30 days.
 * @route GET /api/policies/expiring-soon
 * @access ADMIN, AGENT, CUSTOMER
 */
const getExpiringSoonPolicies = async (req, res, next) => {
  try {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);

    const where = {
      status: 'ACTIVE',
      endDate: {
        gte: now,
        lte: in30Days,
      },
    };

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { OR: [{ userId: req.user.id }, { email: req.user.email.toLowerCase() }] },
      });
      where.customerId = customer ? customer.id : 'non-existent';
    }

    const expiringPolicies = await prisma.policy.findMany({
      where,
      orderBy: { endDate: 'asc' },
      include: {
        customer: { select: { name: true, email: true, phone: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Expiring policies retrieved successfully',
      data: expiringPolicies,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPolicy,
  getPolicies,
  getPolicyById,
  renewPolicy,
  cancelPolicy,
  getExpiringSoonPolicies,
};
