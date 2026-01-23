import express from 'express';
import {
  register,
  login,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  enableMFA,
  verifyMFA,
  refreshToken,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/mfa/enable', authenticate, enableMFA);
router.post('/mfa/verify', verifyMFA);
router.post('/refresh-token', refreshToken);

export default router;

