/**
 * @file pagination.js
 * @description Helper utility for parsing pagination, search, and sorting query params.
 */

/**
 * Extracts and formats standard pagination parameters from Express request query.
 * @param {import('express').Request} req - Express request
 * @param {number} [defaultLimit=10] - Default page size
 * @returns {{ page: number, limit: number, skip: number, search: string, sortBy: string, order: 'asc' | 'desc' }}
 */
const getPaginationParams = (req, defaultLimit = 10) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;
  const search = req.query.search ? String(req.query.search).trim() : '';
  const sortBy = req.query.sortBy ? String(req.query.sortBy) : 'createdAt';
  const order = req.query.order && req.query.order.toLowerCase() === 'asc' ? 'asc' : 'desc';

  return {
    page,
    limit,
    skip,
    search,
    sortBy,
    order,
  };
};

/**
 * Format standard paginated JSON response payload.
 * @param {Array<object>} items - List of database records
 * @param {number} totalCount - Total matching record count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} Standardized paginated structure
 */
const formatPaginatedResponse = (items, totalCount, page, limit) => {
  const totalPages = Math.ceil(totalCount / limit) || 1;
  return {
    items,
    pagination: {
      totalCount,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

module.exports = {
  getPaginationParams,
  formatPaginatedResponse,
};
