import admin from 'firebase-admin';
import { logger } from './logger';
import Notification from '../models/mongodb/Notification.model';
import mongoose from 'mongoose';

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  } catch (error) {
    logger.warn('Firebase Admin not initialized. Notifications will be disabled.');
  }
}

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

// Send push notification
export const sendPushNotification = async (
  token: string,
  payload: NotificationPayload
): Promise<void> => {
  try {
    if (!admin.apps.length) {
      logger.warn('Firebase not initialized. Skipping notification.');
      return;
    }

    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data || {},
      token,
    };

    await admin.messaging().send(message);
    logger.info(`Push notification sent to token: ${token.substring(0, 10)}...`);
  } catch (error: any) {
    logger.error(`Failed to send push notification: ${error.message}`);
    throw error;
  }
};

// Send notification to multiple tokens
export const sendBulkNotifications = async (
  tokens: string[],
  payload: NotificationPayload
): Promise<void> => {
  try {
    if (!admin.apps.length) {
      logger.warn('Firebase not initialized. Skipping notifications.');
      return;
    }

    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data || {},
    };

    const response = await admin.messaging().sendEachForMulticast({
      ...message,
      tokens,
    });

    logger.info(`Sent ${response.successCount} notifications, ${response.failureCount} failed`);
  } catch (error: any) {
    logger.error(`Failed to send bulk notifications: ${error.message}`);
    throw error;
  }
};

// Send email notification (placeholder - integrate with email service)
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  logger.info(`Email would be sent to ${to}: ${subject}`);
};

// Send SMS notification (placeholder - integrate with Twilio)
export const sendSMS = async (
  to: string,
  message: string
): Promise<void> => {
  // TODO: Integrate with Twilio
  logger.info(`SMS would be sent to ${to}: ${message}`);
};

// Create and save notification to database
export const createNotification = async (
  userId: mongoose.Types.ObjectId | string,
  type: 'lab_order' | 'payment_received' | 'test_completed' | 'result_uploaded' | 'prescription_created' | 'test_assigned' | 'appointment_booked' | 'appointment_cancelled' | 'lab_request' | 'appointment',
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<any> => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data,
      read: false,
    });
    logger.info(`Notification created for user ${userId}: ${title}`);
    return notification;
  } catch (error: any) {
    logger.error(`Failed to create notification: ${error.message}`);
    throw error;
  }
};

// Send real-time notification via Socket.io
export const sendRealtimeNotification = (
  io: any,
  userId: string,
  notification: any
): void => {
  try {
    if (io) {
      io.to(userId).emit('notification', notification);
      logger.info(`Real-time notification sent to user ${userId}`);
    }
  } catch (error: any) {
    logger.error(`Failed to send real-time notification: ${error.message}`);
  }
};

// Notify lab staff when patient pays for test
export const notifyLabPayment = async (
  io: any,
  labUserId: mongoose.Types.ObjectId | string,
  patientName: string,
  amount: number,
  testNames: string[],
  requestId: string
): Promise<void> => {
  try {
    const title = 'Payment Received';
    const message = `${patientName} paid ৳${amount.toLocaleString()} for ${testNames.join(', ')}`;

    const notification = await createNotification(
      labUserId,
      'payment_received',
      title,
      message,
      { requestId, amount, testNames }
    );

    sendRealtimeNotification(io, labUserId.toString(), notification);
  } catch (error: any) {
    logger.error(`Failed to notify lab payment: ${error.message}`);
  }
};

// Notify lab when doctor orders test
export const notifyTestOrdered = async (
  io: any,
  labUserId: mongoose.Types.ObjectId | string,
  doctorName: string,
  patientName: string,
  testNames: string[],
  requestId: string,
  urgency?: string
): Promise<void> => {
  try {
    const title = urgency === 'stat' ? '🔴 Critical Lab Test Ordered' : 'New Lab Test Ordered';
    const message = `Dr. ${doctorName} ordered ${testNames.join(', ')} for ${patientName}`;

    const notification = await createNotification(
      labUserId,
      'lab_order',
      title,
      message,
      { requestId, testNames, urgency, doctorName, patientName }
    );

    sendRealtimeNotification(io, labUserId.toString(), notification);
  } catch (error: any) {
    logger.error(`Failed to notify test ordered: ${error.message}`);
  }
};

// Notify doctor and patient when results are uploaded
export const notifyResultUploaded = async (
  io: any,
  userIds: Array<mongoose.Types.ObjectId | string>,
  testNames: string[],
  requestId: string,
  labName: string
): Promise<void> => {
  try {
    const title = 'Lab Results Available';
    const message = `Your lab results for ${testNames.join(', ')} are now available`;

    for (const userId of userIds) {
      const notification = await createNotification(
        userId,
        'result_uploaded',
        title,
        message,
        { requestId, testNames, labName }
      );

      sendRealtimeNotification(io, userId.toString(), notification);
    }
  } catch (error: any) {
    logger.error(`Failed to notify result uploaded: ${error.message}`);
  }
};

// Notify pharmacy when prescription is created
export const notifyPrescriptionCreated = async (
  io: any,
  pharmacyUserId: mongoose.Types.ObjectId | string,
  patientName: string,
  medications: string[],
  prescriptionId: string
): Promise<void> => {
  try {
    const title = 'New Prescription';
    const message = `New prescription for ${patientName}: ${medications.join(', ')}`;

    const notification = await createNotification(
      pharmacyUserId,
      'prescription_created',
      title,
      message,
      { prescriptionId, medications, patientName }
    );

    sendRealtimeNotification(io, pharmacyUserId.toString(), notification);
  } catch (error: any) {
    logger.error(`Failed to notify prescription created: ${error.message}`);
  }
};

// Notify patient when test is assigned to lab
export const notifyTestAssigned = async (
  io: any,
  patientUserId: mongoose.Types.ObjectId | string,
  testNames: string[],
  labName: string,
  requestId: string
): Promise<void> => {
  try {
    const title = 'Lab Test Assigned';
    const message = `Your lab test for ${testNames.join(', ')} has been assigned to ${labName}`;

    const notification = await createNotification(
      patientUserId,
      'test_assigned',
      title,
      message,
      { requestId, testNames, labName }
    );

    sendRealtimeNotification(io, patientUserId.toString(), notification);
  } catch (error: any) {
    logger.error(`Failed to notify test assigned: ${error.message}`);
  }
};

// Notify patient when refill status changes
export const notifyRefillUpdate = async (
  io: any,
  patientUserId: mongoose.Types.ObjectId | string,
  medicationName: string,
  status: string
): Promise<void> => {
  try {
    const title = 'Refill Request Update';
    const message = `Your refill request for ${medicationName} has been ${status}`;

    const notification = await createNotification(
      patientUserId,
      'prescription_created', // Reuse or add new type
      title,
      message,
      { medicationName, status }
    );

    sendRealtimeNotification(io, patientUserId.toString(), notification);
  } catch (error: any) {
    logger.error(`Failed to notify refill update: ${error.message}`);
  }
};

// Notify patient when order status changes
export const notifyOrderStatusUpdate = async (
  io: any,
  patientUserId: mongoose.Types.ObjectId | string,
  orderId: string,
  status: string
): Promise<void> => {
  try {
    const title = 'Order Status Update';
    const message = `Your order #${orderId.slice(-6)} is now ${status}`;

    const notification = await createNotification(
      patientUserId,
      'payment_received', // reusing type or need generic 'order_update'
      title,
      message,
      { orderId, status }
    );

    sendRealtimeNotification(io, patientUserId.toString(), notification);
  } catch (error: any) {
    logger.error(`Failed to notify order status update: ${error.message}`);
  }
};

// Notify users about appointment booking
export const notifyAppointmentBooked = async (
  io: any,
  patientUserId: string | mongoose.Types.ObjectId,
  doctorUserId: string | mongoose.Types.ObjectId,
  appointmentId: string | number,
  date: string,
  time: string,
  doctorName: string,
  patientName: string
): Promise<void> => {
  try {
    // Notify Patient
    const patientTitle = 'Appointment Booked';
    const patientMessage = `Your appointment with Dr. ${doctorName} is scheduled for ${date} at ${time}`;
    const patientNotif = await createNotification(
      patientUserId,
      'appointment_booked',
      patientTitle,
      patientMessage,
      { appointmentId, role: 'patient' }
    );
    sendRealtimeNotification(io, patientUserId.toString(), patientNotif);

    // Notify Doctor
    const doctorTitle = 'New Appointment';
    const doctorMessage = `New appointment booked by ${patientName} on ${date} at ${time}`;
    const doctorNotif = await createNotification(
      doctorUserId,
      'appointment_booked',
      doctorTitle,
      doctorMessage,
      { appointmentId, role: 'doctor' }
    );
    sendRealtimeNotification(io, doctorUserId.toString(), doctorNotif);

  } catch (error: any) {
    logger.error(`Failed to notify appointment booked: ${error.message}`);
  }
};

// Notify users about appointment cancellation
export const notifyAppointmentCancelled = async (
  io: any,
  patientUserId: string | mongoose.Types.ObjectId,
  doctorUserId: string | mongoose.Types.ObjectId,
  appointmentId: string | number,
  date: string,
  doctorName: string,
  patientName: string,
  cancelledByRole: 'patient' | 'doctor'
): Promise<void> => {
  try {
    const title = 'Appointment Cancelled';

    // Notify Patient
    const patientMessage = `Your appointment with Dr. ${doctorName} on ${date} has been cancelled by the ${cancelledByRole}`;
    const patientNotif = await createNotification(
      patientUserId,
      'appointment_cancelled',
      title,
      patientMessage,
      { appointmentId, role: 'patient' }
    );
    sendRealtimeNotification(io, patientUserId.toString(), patientNotif);

    // Notify Doctor
    const doctorMessage = `Appointment with ${patientName} on ${date} has been cancelled by the ${cancelledByRole}`;
    const doctorNotif = await createNotification(
      doctorUserId,
      'appointment_cancelled',
      title,
      doctorMessage,
      { appointmentId, role: 'doctor' }
    );
    sendRealtimeNotification(io, doctorUserId.toString(), doctorNotif);

  } catch (error: any) {
    logger.error(`Failed to notify appointment cancelled: ${error.message}`);
  }
};

// Notify Lab about assignment
export const notifyLabRequestAssigned = async (
  io: any,
  labUserId: string | mongoose.Types.ObjectId,
  requestId: string | mongoose.Types.ObjectId,
  assignerName: string
): Promise<void> => {
  try {
    const title = 'New Lab Request';
    const message = `New lab test request assigned from ${assignerName}`;

    const notification = await createNotification(
      labUserId,
      'lab_request',
      title,
      message,
      { requestId, role: 'lab' }
    );

    sendRealtimeNotification(io, labUserId.toString(), notification);
  } catch (error: any) {
    logger.error(`Failed to notify lab request assigned: ${error.message}`);
  }
};
