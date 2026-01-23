import twilio from 'twilio';
import { logger } from './logger';

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS
export const sendSMS = async (
  to: string,
  message: string
): Promise<void> => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      logger.warn('Twilio credentials not configured. SMS not sent.');
      return;
    }

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });

    logger.info(`SMS sent to ${to}`);
  } catch (error: any) {
    logger.error(`Failed to send SMS: ${error.message}`);
    throw error;
  }
};

// SMS templates
export const smsTemplates = {
  appointmentReminder: (name: string, date: string, time: string) =>
    `Hi ${name}, reminder: You have an appointment on ${date} at ${time}. - HealthLife`,

  medicationReminder: (name: string, medication: string) =>
    `Hi ${name}, time to take your ${medication}. - HealthLife`,

  labResultsReady: (name: string) =>
    `Hi ${name}, your lab results are ready. Check your HealthLife account. - HealthLife`,

  prescriptionReady: (name: string) =>
    `Hi ${name}, a new prescription is available. Check your HealthLife account. - HealthLife`,
};

