import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { createPrescriptionOrder } from '../controllers/order.controller';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// Protect all routes
router.use(authenticate);

router.post(
    '/prescription',
    authorize('patient'),
    [
        body('medicines').isArray().withMessage('Medicines must be an array'),
        body('medicines.*.medicineId').exists().withMessage('Medicine ID is required'),
        body('medicines.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        body('pharmacyId').exists().withMessage('Pharmacy ID is required'),
        body('shippingAddress').isObject().withMessage('Shipping address is required'),
        validateRequest
    ],
    createPrescriptionOrder
);

export default router;
