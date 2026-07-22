/**
 * @file auth.js
 * @description Middleware for verifying JWT tokens and enforcing role authorization.
 */

const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

/**
 * Authenticate incoming requests via Bearer JWT Access Token.
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid format',
        error: 'Unauthorized',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_access_key_12345');

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        customer: {
          select: { id: true }
        }
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User associated with token no longer exists',
        error: 'Unauthorized',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired',
        error: 'TokenExpired',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid access token',
      error: error.message,
    });
  }
};

/**
 * Authorize users based on allowed roles.
 * @param {...string} roles - Allowed role strings ('ADMIN', 'AGENT', 'CUSTOMER')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${roles.join(', ')}]`,
        error: 'Forbidden',
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
