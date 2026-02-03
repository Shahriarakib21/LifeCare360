import express from 'express';
import {
  getProfile,
  updateProfile,
  getEHR,
  addEHR,
  uploadReport,
  getHealthTrends,
  getMedications,
  addMedicationReminder,
  updateConsentSettings,
  getEmergencyContacts,
  addEmergencyContact,
  getAppointments,
  getAvailableSlots,
  getLabReports,
  uploadPrescription,
  generatePrescriptionPDF,
  deletePrescription,
  bookAppointment,
  rateDoctor,
  initiatePayment,
  deleteAccount,
  getAllLabs,
  getLabTestRequests,
  assignLabToRequest,
  generateLabResultPDF,
  payAppointmentFee,
  cancelAppointment,
  createLabOrder,
  getLabOrders,
} from '../controllers/patient.controller';
import { processLabPayment, getAvailableLabsForTests, getAllLabTests, getPostgresLabRequests } from '../controllers/lab.controller';
import { createPrescriptionOrder } from '../controllers/pharmacy.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(authorize('patient'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/ehr', getEHR);
router.post('/ehr', addEHR);
router.post('/reports/upload', upload.single('file'), uploadReport);
router.get('/trends', getHealthTrends);
router.get('/medications', getMedications);
router.post('/medications/reminders', addMedicationReminder);
router.get('/consent', updateConsentSettings); // GET to view, PUT to update
router.put('/consent', updateConsentSettings);
router.get('/emergency-contacts', getEmergencyContacts);
router.post('/emergency-contacts', addEmergencyContact);
router.get('/appointments', getAppointments);
router.get('/appointments/available-slots', getAvailableSlots);
router.post('/appointments', bookAppointment);
router.get('/lab-reports', getLabReports);
router.post('/prescriptions/upload', upload.single('file'), uploadPrescription);
router.post('/prescriptions/:ehrId/generate-pdf', generatePrescriptionPDF);
router.post('/lab-results/:ehrId/generate-pdf', generateLabResultPDF);
router.delete('/prescriptions/:prescriptionId', deletePrescription);
router.post('/appointments/:appointmentId/rate', rateDoctor);
router.post('/appointments/:appointmentId/initiate-payment', initiatePayment);
router.post('/appointments/:appointmentId/pay', payAppointmentFee);
router.delete('/account', deleteAccount);
router.put('/appointments/:appointmentId/cancel', cancelAppointment);
router.get('/labs', getAllLabs);
router.get('/lab-requests', getLabTestRequests);
router.get('/lab-requests/:requestId/available-labs', getAvailableLabsForTests);
router.post('/lab-requests/assign', assignLabToRequest);
router.post('/lab-requests/pay', processLabPayment);
router.post('/lab-orders', createLabOrder);
router.get('/lab-orders', getLabOrders);
router.get('/lab-tests/master', getAllLabTests);
router.get('/lab-requests/postgres', getPostgresLabRequests);
router.post('/orders/prescription', createPrescriptionOrder);

export default router;

