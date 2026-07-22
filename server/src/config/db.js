/**
 * @file db.js
 * @description Prisma client instance configuration for database access.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
