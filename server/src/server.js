/**
 * @file server.js
 * @description Application server entrypoint.
 */

require('dotenv').config();
const app = require('./app');
const prisma = require('./config/db');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Server] Insurance Management Platform running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]', err);
  server.close(() => {
    prisma.$disconnect();
    process.exit(1);
  });
});
