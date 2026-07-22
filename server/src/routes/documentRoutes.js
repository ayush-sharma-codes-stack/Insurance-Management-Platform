/**
 * @file documentRoutes.js
 * @description Express routes for Document Upload and Management.
 */

const express = require('express');
const router = express.Router();

const documentController = require('../controllers/documentController');
const upload = require('../middleware/upload');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/', documentController.getDocuments);
router.get('/:id/download', documentController.downloadDocument);
router.delete('/:id', authorize('ADMIN', 'AGENT'), documentController.deleteDocument);

module.exports = router;
