/**
 * @file claimController.js
 * @description Controllers for Claim submission, listing, review/approval, and history.
 */

const prisma = require('../config/db');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');

/**
 * Submit a new Claim for an Active Policy.
 * Business Rule: Claims can ONLY be submitted if Policy status is ACTIVE.
 * @route POST /api/claims
 * @access CUSTOMER, AGENT, ADMIN
 */
const createClaim = async (req, res, next) => {
  try {
    const { policyId, claimAmount, reason } = req.body;

    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
      include: { customer: true },
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found',
        error: 'NotFound',
      });
    }

    // Customer security check
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { OR: [{ userId: req.user.id }, { email: req.user.email.toLowerCase() }] },
      });
      if (!customer || policy.customerId !== customer.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only file claims against your own policies',
          error: 'Forbidden',
        });
      }
    }

    // STRICT BUSINESS RULE: Claim can ONLY be submitted if policy status = ACTIVE
    if (policy.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Claim cannot be submitted because policy status is '${policy.status}'. Only ACTIVE policies are eligible for claims.`,
        error: 'PolicyNotActive',
      });
    }

    const claim = await prisma.claim.create({
      data: {
        policyId,
        claimAmount,
        reason,
        status: 'PENDING',
        submissionDate: new Date(),
      },
      include: {
        policy: {
          include: { customer: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Claim submitted successfully and is pending review',
      data: claim,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get claims list with status filter & pagination.
 * @route GET /api/claims
 * @access ADMIN, AGENT, CUSTOMER
 */
const getClaims = async (req, res, next) => {
  try {
    const { page, limit, skip, search, sortBy, order } = getPaginationParams(req);
    const { status } = req.query;

    const where = {
      ...(status && { status: String(status).toUpperCase() }),
      ...(search && {
        OR: [
          { reason: { contains: search, mode: 'insensitive' } },
          { policy: { policyNumber: { contains: search, mode: 'insensitive' } } },
          { policy: { customer: { name: { contains: search, mode: 'insensitive' } } } },
        ],
      }),
    };

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { OR: [{ userId: req.user.id }, { email: req.user.email.toLowerCase() }] },
      });
      where.policy = { customerId: customer ? customer.id : 'non-existent' };
    }

    const [claims, totalCount] = await Promise.all([
      prisma.claim.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy === 'createdAt' ? 'createdAt' : sortBy]: order },
        include: {
          policy: {
            include: {
              customer: { select: { id: true, name: true, email: true, phone: true } },
            },
          },
          reviewer: { select: { id: true, name: true, role: true } },
          documents: true,
        },
      }),
      prisma.claim.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Claims retrieved successfully',
      data: formatPaginatedResponse(claims, totalCount, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Claim details by ID.
 * @route GET /api/claims/:id
 * @access ADMIN, AGENT, CUSTOMER
 */
const getClaimById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        policy: {
          include: { customer: true, agent: { select: { name: true, email: true } } },
        },
        reviewer: { select: { id: true, name: true, role: true } },
        documents: true,
      },
    });

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found',
        error: 'NotFound',
      });
    }

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { OR: [{ userId: req.user.id }, { email: req.user.email.toLowerCase() }] },
      });
      if (!customer || claim.policy.customerId !== customer.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You cannot view this claim',
          error: 'Forbidden',
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Claim retrieved successfully',
      data: claim,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Review, Approve or Reject a Claim.
 * @route PUT /api/claims/:id/review
 * @access ADMIN, AGENT
 */
const reviewClaim = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    const claim = await prisma.claim.findUnique({ where: { id } });
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found',
        error: 'NotFound',
      });
    }

    const updatedClaim = await prisma.claim.update({
      where: { id },
      data: {
        status,
        reviewNotes,
        reviewedBy: req.user.id,
      },
      include: {
        policy: { include: { customer: true } },
        reviewer: { select: { id: true, name: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Claim status successfully updated to ${status}`,
      data: updatedClaim,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClaim,
  getClaims,
  getClaimById,
  reviewClaim,
};
