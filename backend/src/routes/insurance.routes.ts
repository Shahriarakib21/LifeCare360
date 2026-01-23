import express from 'express';
import {
  verifyClaim,
  getClaims,
  getPatientCoverage,
} from '../controllers/insurance.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate);
router.use(authorize('insurance'));

router.post('/claims/verify', verifyClaim);
router.get('/claims', getClaims);
router.get('/patients/:patientId/coverage', getPatientCoverage);

export default router;

