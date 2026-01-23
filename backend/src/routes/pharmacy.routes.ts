import express from 'express';
import {
  searchMedicines,
  getMedicineDetails,
  getAlternatives,
  createOrder,
  getOrders,
  getRefillNotifications,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  updateOrderStatus,
  getAllPrescriptions,
  getDashboardStats,
  getCustomers,
  updateRefillStatus,
  payOrder,
} from '../controllers/pharmacy.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes
router.get('/medicines/search', searchMedicines);
router.get('/medicines/:id', getMedicineDetails);
router.get('/medicines/:id/alternatives', getAlternatives);

// Protected routes (General Auth)
router.use(authenticate);

// Patient & Pharmacy routes
router.post('/orders', authorize('patient', 'pharmacy', 'admin'), createOrder);
// Note: Pharmacy might create orders on behalf of walk-ins? For now allow 'patient' primarily, but 'pharmacy' is good too.
// getOrders logic handles role check
router.get('/orders', authorize('patient', 'pharmacy', 'admin'), getOrders);
router.patch('/orders/:orderId/pay', authorize('patient'), payOrder);

// Refills
router.get('/refill-notifications', authorize('pharmacy', 'admin'), getRefillNotifications);
router.put('/refills/:id', authorize('pharmacy', 'admin'), updateRefillStatus);
router.get('/refills/my', authorize('patient'), getRefillNotifications); // For patients to see their own if needed

// Pharmacy Staff / Admin routes
router.post('/medicines', authorize('pharmacy', 'admin'), addMedicine);
router.put('/medicines/:id', authorize('pharmacy', 'admin'), updateMedicine);
router.delete('/medicines/:id', authorize('pharmacy', 'admin'), deleteMedicine);
router.patch('/orders/:id/status', authorize('pharmacy', 'admin'), updateOrderStatus);
router.get('/prescriptions', authorize('pharmacy', 'admin'), getAllPrescriptions);
router.get('/stats', authorize('pharmacy', 'admin'), getDashboardStats);
router.get('/customers', authorize('pharmacy', 'admin'), getCustomers);

export default router;

