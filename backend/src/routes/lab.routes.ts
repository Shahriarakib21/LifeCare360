import express from 'express';
import {
  uploadTestResults,
  getTestResults,
  getPatientTests,
  getPendingRequests,
  getLabRequests,
  submitTestResults,
  createTestRequest,
  getDashboardStats,
  generateLabResultPDF,
  getTestPrices,
  upsertTestPrice,
  deleteTestPrice,
  getProfile,
  updateProfile,
  getNotifications,
  uploadReportFile,
  searchPatients,
  processLabPayment,
  getLabRevenue,
  getRevenueAnalytics,
  getLabNotifications,
  markNotificationAsRead,
  deleteNotification,
  updateLabRequestStatus,
  getAllLabTests,
  createPostgresLabRequest,
  getPostgresLabRequests,
} from '../controllers/lab.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = express.Router();

router.use(authenticate);

// --- New PostgreSQL Master Test List (Accessible by all roles) ---
router.get('/master-tests', authorize('lab', 'doctor', 'patient', 'admin'), getAllLabTests);

// --- Lab Requests (PostgreSQL) ---
router.post('/postgres-requests', authorize('doctor', 'lab', 'admin'), createPostgresLabRequest);
router.get('/postgres-requests', authorize('lab', 'doctor', 'patient', 'admin'), getPostgresLabRequests);

// --- Legacy Lab Routes (Mostly restricted to 'lab' role) ---
router.get('/dashboard/stats', authorize('lab'), getDashboardStats);
router.get('/notifications', getNotifications);
router.get('/requests', getLabRequests);
router.get('/requests/pending', getPendingRequests);
router.post('/requests', createTestRequest);
router.post('/requests/submit', submitTestResults);
router.post('/requests/:requestId/upload', upload.single('report'), uploadReportFile);
router.post('/results/:ehrId/generate-pdf', generateLabResultPDF);
router.put('/requests/:requestId/status', updateLabRequestStatus);

// Test results
router.post('/results', uploadTestResults);
router.get('/results', getTestResults);
router.get('/patients/search', searchPatients);
router.get('/patients/:patientId/tests', getPatientTests);

// Pricing
router.get('/prices', getTestPrices);
router.post('/prices', upsertTestPrice);
router.put('/prices/:priceId', upsertTestPrice);
router.delete('/prices/:priceId', deleteTestPrice);

// Profile
router.get('/profile', getProfile);
router.put('/profile', upload.single('profileImage'), updateProfile);

// Payment & Revenue
router.post('/payment', processLabPayment);
router.get('/revenue', getLabRevenue);
router.get('/revenue/analytics', getRevenueAnalytics);

// Notifications
router.get('/notifications/lab', authorize('lab'), getLabNotifications);
router.put('/notifications/:id/read', authorize('lab'), markNotificationAsRead);
router.delete('/notifications/:id', authorize('lab'), deleteNotification);

export default router;

