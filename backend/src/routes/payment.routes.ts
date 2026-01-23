import express from 'express';
import {
    initiatePayment,
    completePayment,
    getPendingPayments,
    getPaymentByInvoice,
    expireOldPayments,
} from '../controllers/unifiedPayment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require patient authentication
router.use(authenticate);
router.use(authorize('patient'));

/**
 * @route   POST /api/payments/initiate
 * @desc    Initialize a payment for Doctor/Lab/Pharmacy service
 * @access  Private (Patient)
 */
router.post('/initiate', initiatePayment);

/**
 * @route   POST /api/payments/complete
 * @desc    Complete a payment after gateway confirmation
 * @access  Private (Patient)
 */
router.post('/complete', completePayment);

/**
 * @route   GET /api/payments/pending
 * @desc    Get all pending payments for the authenticated patient
 * @access  Private (Patient)
 */
router.get('/pending', getPendingPayments);

/**
 * @route   GET /api/payments/:invoiceId
 * @desc    Get payment details by invoice ID
 * @access  Private (Patient)
 */
router.get('/:invoiceId', getPaymentByInvoice);

/**
 * @route   POST /api/payments/expire-old
 * @desc    Expire old pending payments (cron job)
 * @access  Private (Admin/System)
 */
router.post('/expire-old', expireOldPayments);

export default router;
