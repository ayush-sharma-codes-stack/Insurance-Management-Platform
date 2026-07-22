/**
 * @file documentController.js
 * @description Controllers for Document Upload, Listing, Download, and Deletion.
 */

const fs = require('fs');
const path = require('path');
const prisma = require('../config/db');

/**
 * Upload a new Document.
 * @route POST /api/documents/upload
 * @access ADMIN, AGENT, CUSTOMER
 */
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded or file failed validation (max 5MB, PDF/JPG/PNG)',
        error: 'BadRequest',
      });
    }

    const { customerId, claimId } = req.body;

    if (!customerId) {
      // Clean up temp uploaded file if customerId is missing
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required for document upload',
        error: 'BadRequest',
      });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        error: 'NotFound',
      });
    }

    if (claimId) {
      const claim = await prisma.claim.findUnique({ where: { id: claimId } });
      if (!claim) {
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({
          success: false,
          message: 'Claim not found',
          error: 'NotFound',
        });
      }
    }

    const documentRecord = await prisma.document.create({
      data: {
        customerId,
        claimId: claimId || null,
        fileName: req.file.originalname,
        filePath: req.file.filename,
        fileType: req.file.mimetype,
      },
      include: {
        customer: { select: { id: true, name: true } },
        claim: { select: { id: true, reason: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: documentRecord,
    });
  } catch (error) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * List Documents filtered by customerId or claimId.
 * @route GET /api/documents
 * @access ADMIN, AGENT, CUSTOMER
 */
const getDocuments = async (req, res, next) => {
  try {
    const { customerId, claimId } = req.query;

    const where = {
      ...(customerId && { customerId }),
      ...(claimId && { claimId }),
    };

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { OR: [{ userId: req.user.id }, { email: req.user.email.toLowerCase() }] },
      });
      where.customerId = customer ? customer.id : 'non-existent';
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      include: {
        customer: { select: { name: true } },
        claim: { select: { reason: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Documents retrieved successfully',
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download or view document file.
 * @route GET /api/documents/:id/download
 * @access ADMIN, AGENT, CUSTOMER
 */
const downloadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const documentRecord = await prisma.document.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!documentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Document record not found',
        error: 'NotFound',
      });
    }

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { OR: [{ userId: req.user.id }, { email: req.user.email.toLowerCase() }] },
      });
      if (!customer || documentRecord.customerId !== customer.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You cannot download documents for other customers',
          error: 'Forbidden',
        });
      }
    }

    const fullFilePath = path.join(__dirname, '../../uploads', documentRecord.filePath);

    if (!fs.existsSync(fullFilePath)) {
      return res.status(404).json({
        success: false,
        message: 'Physical file not found on server',
        error: 'FileNotFound',
      });
    }

    return res.download(fullFilePath, documentRecord.fileName);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete document record and file.
 * @route DELETE /api/documents/:id
 * @access ADMIN, AGENT
 */
const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const documentRecord = await prisma.document.findUnique({ where: { id } });

    if (!documentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Document record not found',
        error: 'NotFound',
      });
    }

    const fullFilePath = path.join(__dirname, '../../uploads', documentRecord.filePath);

    if (fs.existsSync(fullFilePath)) {
      fs.unlinkSync(fullFilePath);
    }

    await prisma.document.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  downloadDocument,
  deleteDocument,
};
