/**
 * @file customerController.js
 * @description Controllers for Customer CRUD, pagination, search, and detail retrieval.
 */

const prisma = require('../config/db');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');

/**
 * Create a new Customer record.
 * @route POST /api/customers
 * @access ADMIN, AGENT
 */
const createCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, address, dob, userId } = req.body;

    const existingCustomer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: 'A customer with this email address already exists',
        error: 'Conflict',
      });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone,
        address,
        dob: new Date(dob),
        userId: userId || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get paginated list of Customers with search filter.
 * CUSTOMER role can only access their own profile.
 * @route GET /api/customers
 * @access ADMIN, AGENT, CUSTOMER
 */
const getCustomers = async (req, res, next) => {
  try {
    // If logged in as CUSTOMER, restrict to own profile
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { userId: req.user.id },
            { email: req.user.email.toLowerCase() },
          ],
        },
        include: {
          policies: true,
          documents: true,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Customer profile retrieved',
        data: formatPaginatedResponse(customer ? [customer] : [], customer ? 1 : 0, 1, 10),
      });
    }

    const { page, limit, skip, search, sortBy, order } = getPaginationParams(req);

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const validSortFields = ['name', 'email', 'createdAt', 'dob'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: order },
        include: {
          user: { select: { id: true, name: true, role: true } },
          _count: { select: { policies: true, documents: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Customers retrieved successfully',
      data: formatPaginatedResponse(customers, totalCount, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Customer detail by ID.
 * @route GET /api/customers/:id
 * @access ADMIN, AGENT, CUSTOMER (own profile only)
 */
const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        policies: {
          include: {
            agent: { select: { name: true } },
            premiums: { orderBy: { dueDate: 'desc' } },
            claims: { orderBy: { submissionDate: 'desc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
        documents: { orderBy: { uploadedAt: 'desc' } },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        error: 'NotFound',
      });
    }

    // Role check for customer
    if (req.user.role === 'CUSTOMER' && customer.userId !== req.user.id && customer.email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only view your own customer profile',
        error: 'Forbidden',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer details retrieved successfully',
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Customer details.
 * @route PUT /api/customers/:id
 * @access ADMIN, AGENT, CUSTOMER (own profile only)
 */
const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, dob } = req.body;

    const existingCustomer = await prisma.customer.findUnique({ where: { id } });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        error: 'NotFound',
      });
    }

    if (req.user.role === 'CUSTOMER' && existingCustomer.userId !== req.user.id && existingCustomer.email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only update your own profile',
        error: 'Forbidden',
      });
    }

    if (email && email.toLowerCase() !== existingCustomer.email) {
      const emailConflict = await prisma.customer.findUnique({ where: { email: email.toLowerCase() } });
      if (emailConflict) {
        return res.status(409).json({
          success: false,
          message: 'Another customer is already registered with this email address',
          error: 'Conflict',
        });
      }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email: email.toLowerCase() }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(dob && { dob: new Date(dob) }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Customer profile updated successfully',
      data: updatedCustomer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Customer.
 * @route DELETE /api/customers/:id
 * @access ADMIN
 */
const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        error: 'NotFound',
      });
    }

    await prisma.customer.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Customer record and associated data deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
