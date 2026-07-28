/**
 * @file authController.js
 * @description Controllers handling User Registration, Authentication, Token Refresh, and Logout.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_access_key_12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_jwt_refresh_key_67890';

/**
 * Generate Access and Refresh tokens for a given user.
 * @param {object} user - User object containing id, email, role
 * @returns {{ accessToken: string, refreshToken: string }}
 */
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

/**
 * Register a new CUSTOMER user.
 * @route POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists',
        error: 'Conflict',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'CUSTOMER',
        customer: {
          create: {
            name,
            email: email.toLowerCase(),
            phone: 'N/A',
            address: 'N/A',
            dob: new Date('1990-01-01'),
          },
        },
      },
      include: {
        customer: true,
      },
    });

    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          customerId: user.customer ? user.customer.id : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user and issue JWT credentials.
 * @route POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        customer: {
          select: { id: true }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'Unauthorized',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'Unauthorized',
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          customerId: user.customer ? user.customer.id : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh Access Token using httpOnly Refresh Token cookie.
 * @route POST /api/auth/refresh
 */
const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token cookie missing',
        error: 'Unauthorized',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        error: 'Unauthorized',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        customer: { select: { id: true } }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
        error: 'Unauthorized',
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          customerId: user.customer ? user.customer.id : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user by clearing httpOnly refreshToken cookie.
 * @route POST /api/auth/logout
 */
const logout = async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * Get current authenticated user details.
 * @route GET /api/auth/me
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: req.user,
  });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
};
