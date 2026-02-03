import express from 'express';
import multer from 'multer';
import {
  getProfile,
  updateProfile,
  getPatients,
  getPatientHistory,
  createPrescription,
  updatePrescription,
  createDiagnosis,
  requestLabTest,
  getAppointments,
  createAppointment,
  updateAppointment,
  recordVisitFee,
} from '../controllers/doctor.controller';
import {
  getDoctorEarningsReport,
  getDoctorTransactions,
} from '../controllers/finance.controller';
import {
  getTemplates,
  createTemplate,
  deleteTemplate,
} from '../controllers/prescriptionTemplate.controller';
import { assignLabToRequest } from '../controllers/patient.controller';
import { getAllLabTests, createPostgresLabRequest, getPostgresLabRequests } from '../controllers/lab.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate);
router.use(authorize('doctor'));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.get('/profile', getProfile);
router.put('/profile', upload.single('profileImage'), updateProfile);
router.get('/patients', getPatients);
router.get('/patients/:patientId/history', getPatientHistory);
router.post('/prescriptions', createPrescription);
router.post('/diagnosis', createDiagnosis);
router.post('/lab-tests/request', requestLabTest);
router.get('/lab-tests/master', getAllLabTests);
router.post('/lab-tests/postgres-request', createPostgresLabRequest);
router.get('/lab-requests/postgres', getPostgresLabRequests);
router.post('/lab-requests/assign', assignLabToRequest);
router.get('/appointments', getAppointments);
router.post('/appointments', createAppointment);
router.put('/appointments/:appointmentId', updateAppointment);
router.post('/appointments/:appointmentId/fee', recordVisitFee);
router.get('/finance/report', getDoctorEarningsReport);
router.get('/finance/transactions', getDoctorTransactions);
router.get('/prescription-templates', getTemplates);
router.post('/prescription-templates', createTemplate);
router.delete('/prescription-templates/:templateId', deleteTemplate);
router.put('/prescriptions/:ehrId', updatePrescription);

export default router;

