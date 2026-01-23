import nodemailer from 'nodemailer';
import { logger } from './logger';

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter configuration
transporter.verify((error) => {
  if (error) {
    logger.warn('Email transporter not configured properly:', error.message);
  } else {
    logger.info('Email transporter ready');
  }
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Send email
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn('SMTP credentials not configured. Email not sent.');
      return;
    }

    const mailOptions = {
      from: `HealthLife <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.to}`);
  } catch (error: any) {
    logger.error(`Failed to send email: ${error.message}`);
    throw error;
  }
};

// Email templates
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: 'Welcome to HealthLife',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0ea5e9;">Welcome to HealthLife!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for joining HealthLife. Your account has been created successfully.</p>
        <p>You can now start managing your health records and connecting with healthcare providers.</p>
        <p>Best regards,<br>The HealthLife Team</p>
      </div>
    `,
  }),

  passwordReset: (name: string, resetLink: string) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0ea5e9;">Password Reset</h1>
        <p>Hi ${name},</p>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
          Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  }),

  appointmentConfirmation: (name: string, appointmentDetails: any) => ({
    subject: 'Appointment Confirmed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0ea5e9;">Appointment Confirmed</h1>
        <p>Hi ${name},</p>
        <p>Your appointment has been confirmed:</p>
        <ul>
          <li><strong>Date:</strong> ${appointmentDetails.date}</li>
          <li><strong>Time:</strong> ${appointmentDetails.time}</li>
          <li><strong>Type:</strong> ${appointmentDetails.type}</li>
        </ul>
        ${appointmentDetails.meetingLink ? `<p><a href="${appointmentDetails.meetingLink}">Join Video Call</a></p>` : ''}
      </div>
    `,
  }),

  prescriptionReady: (name: string, prescriptionDetails: any) => ({
    subject: 'New Prescription Available',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0ea5e9;">New Prescription</h1>
        <p>Hi ${name},</p>
        <p>Your doctor has prescribed:</p>
        <ul>
          <li><strong>Medication:</strong> ${prescriptionDetails.medication}</li>
          <li><strong>Dosage:</strong> ${prescriptionDetails.dosage}</li>
          <li><strong>Frequency:</strong> ${prescriptionDetails.frequency}</li>
        </ul>
        <p>Please follow the instructions provided by your doctor.</p>
      </div>
    `,
  }),
};

