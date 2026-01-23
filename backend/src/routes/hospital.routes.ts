import express from 'express';
import {
  syncPatientData,
  getAdmittedPatients,
  updatePatientStatus,
} from '../controllers/hospital.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate);
router.use(authorize('hospital'));

router.post('/sync', syncPatientData);
router.get('/patients', getAdmittedPatients);
router.put('/patients/:patientId/status', updatePatientStatus);

export default router;

