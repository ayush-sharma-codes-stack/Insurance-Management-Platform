/**
 * @file premiumRoutes.js
 * @description Express routes for Premium Tracking.
 */

const express = require('express');
const router = express.Router();

const premiumController = require('../controllers/premiumController');
const validate = require('../middleware/validate');
const { payPremiumSchema } = require('../validators/premiumValidator');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', premiumController.getAllPremiums);
router.get('/overdue', premiumController.getOverduePremiums);
router.get('/policy/:policyId', premiumController.getPolicyPremiums);
router.get('/:id/receipt', premiumController.downloadReceipt);
router.put('/:id/pay', validate(payPremiumSchema), premiumController.recordPayment);

module.exports = router;
