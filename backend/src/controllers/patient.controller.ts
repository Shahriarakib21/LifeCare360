import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/mongodb/User.model';
import Patient from '../models/mongodb/Patient.model';
import EHR from '../models/mongodb/EHR.model';
import Notification from '../models/mongodb/Notification.model';
import Appointment from '../models/postgres/Appointment.model';
import Doctor from '../models/postgres/Doctor.model';
import Rating from '../models/postgres/Rating.model';
import TestPrice from '../models/mongodb/TestPrice.model';
import RevenueTransaction from '../models/mongodb/RevenueTransaction.model';
import UnifiedPayment from '../models/mongodb/UnifiedPayment.model';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';
import { getIO } from '../utils/socket';
import {
  notifyAppointmentBooked,
  notifyAppointmentCancelled,
  notifyLabRequestAssigned
} from '../utils/notifications';

// Get patient profile
export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          profile: user.profile,
        },
        patient: {
          emergencyContacts: patient.emergencyContacts,
          insurance: patient.insurance,
          preferences: patient.preferences,
          consentSettings: patient.consentSettings,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update patient profile
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const updates = req.body;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (updates.profile) {
      user.profile = { ...user.profile, ...updates.profile };
      await user.save();
    }

    // Also update Patient model if patient-specific fields are present
    if (updates.insurance || updates.preferences) {
      const patient = await Patient.findOne({ userId: user._id });
      if (patient) {
        if (updates.insurance) {
          patient.insurance = { ...patient.insurance, ...updates.insurance };
        }
        if (updates.preferences) {
          patient.preferences = { ...patient.preferences, ...updates.preferences };
        }
        await patient.save();
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          profile: user.profile,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get EHR records
export const getEHR = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { type, startDate, endDate, limit = 50, page = 1 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    const query: any = { patientId: patient._id };

    if (type) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const ehrRecords = await EHR.find(query)
      .sort({ date: -1 })
      .limit(Number(limit))
      .skip(skip)
      .populate('recordedBy', 'profile')
      .lean();

    // Populate labId for lab test requests (since nested populate doesn't work with mixed types)
    for (const record of ehrRecords) {
      if (record.data?.labTestRequest?.labId) {
        const labId = record.data.labTestRequest.labId;
        // Check if it's an ObjectId string or ObjectId object (not already populated with email)
        const labIdString = typeof labId === 'string' ? labId : (labId?._id?.toString() || labId?.toString());
        if (labIdString && !(labId as any).email) {
          const labUser = await User.findById(labIdString).select('email profile').lean();
          if (labUser) {
            (record.data.labTestRequest as any).labId = labUser;
          }
        }
      }
    }

    const total = await EHR.countDocuments(query);

    res.json({
      success: true,
      data: {
        records: ehrRecords,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add EHR record
export const addEHR = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { type, date, data, tags } = req.body;

    if (!type || !date || !data) {
      throw new AppError('Type, date, and data are required', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    const ehr = await EHR.create({
      patientId: patient._id,
      type,
      date: new Date(date),
      data,
      tags: tags || [],
    });

    logger.info(`EHR record added for patient: ${userId}`);

    res.status(201).json({
      success: true,
      message: 'EHR record added successfully',
      data: { ehr },
    });
  } catch (error) {
    next(error);
  }
};

// Upload medical report
export const uploadReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    // File upload would be handled by multer middleware
    // This is a placeholder - actual implementation would use AWS S3

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    // TODO: Upload file to S3 and create EHR record with attachment
    const fileUrl = 'https://s3.amazonaws.com/healthlife-storage/...'; // Placeholder

    const ehr = await EHR.create({
      patientId: patient._id,
      type: 'note',
      date: new Date(),
      data: {
        notes: 'Uploaded medical report',
        attachments: [
          {
            type: req.body.fileType || 'pdf',
            url: fileUrl,
            name: req.body.fileName || 'report',
            uploadedAt: new Date(),
          },
        ],
      },
    });

    res.status(201).json({
      success: true,
      message: 'Report uploaded successfully',
      data: { ehr },
    });
  } catch (error) {
    next(error);
  }
};

// Get health trends
export const getHealthTrends = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { metric, days = 30 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    // Map metrics to EHR types
    let queryType = ['vital', 'lab'];
    let metricStr = '';

    if (typeof metric === 'string') {
      metricStr = metric;
    } else if (Array.isArray(metric) && metric.length > 0) {
      metricStr = String(metric[0]);
    }

    const ehrRecords = await EHR.find({
      patientId: patient._id,
      type: { $in: queryType },
      date: { $gte: startDate },
    }).sort({ date: 1 });

    const trends = ehrRecords.map((record) => {
      let value: any = null;
      // Extract value based on metric
      if (record.type === 'vital' && record.data.vitals && metricStr) {
        // Handle case mismatch or direct match
        const vitals = record.data.vitals as Record<string, any>;
        // Try direct match or common variations
        const key = Object.keys(vitals).find(k => k.toLowerCase() === metricStr.toLowerCase());
        if (key) value = vitals[key];
      }
      if (!value && record.type === 'lab' && record.data.labResults) {
        // Check if any of the tests in this lab report match the metric
        const labTestReq = record.data.labTestRequest;
        const hasMatch = labTestReq?.tests?.some((t: any) => {
          const name = typeof t === 'string' ? t : t.name;
          return name?.toLowerCase().includes(metricStr.toLowerCase());
        });

        if (hasMatch) {
          value = record.data.labResults?.[0]?.value;
        }
      }

      // Only return if we found a value
      if (value) {
        return {
          date: record.date,
          value,
        };
      }
      return null;
    }).filter(t => t !== null); // Filter out records that didn't match the metric


    res.json({
      success: true,
      data: { trends },
    });
  } catch (error) {
    next(error);
  }
};

// Get medications
export const getMedications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    console.log(`Fetching medications for patient: ${patient._id}`);
    const start = Date.now();
    const prescriptions = await EHR.find({
      patientId: patient._id,
      type: 'prescription',
    })
      .sort({ date: -1 })
      .populate('recordedBy', 'profile');

    console.log(`Found ${prescriptions.length} prescriptions in ${Date.now() - start}ms`);

    res.json({
      success: true,
      data: { medications: prescriptions },
    });
  } catch (error) {
    next(error);
  }
};

// Add medication reminder
export const addMedicationReminder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { medication, time, frequency, duration } = req.body;

    if (!medication || !time || !frequency) {
      throw new AppError('Medication, time, and frequency are required', 400);
    }

    // TODO: Create reminder in notification system (Firebase)
    logger.info(`Medication reminder added for user: ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Medication reminder added successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Update consent settings
export const updateConsentSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const consentSettings = req.body;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    if (req.method === 'GET') {
      res.json({
        success: true,
        data: { consentSettings: patient.consentSettings },
      });
      return;
    }

    patient.consentSettings = { ...patient.consentSettings, ...consentSettings };
    await patient.save();

    res.json({
      success: true,
      message: 'Consent settings updated successfully',
      data: { consentSettings: patient.consentSettings },
    });
  } catch (error) {
    next(error);
  }
};

// Get emergency contacts
export const getEmergencyContacts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    res.json({
      success: true,
      data: { emergencyContacts: patient.emergencyContacts },
    });
  } catch (error) {
    next(error);
  }
};

// Add emergency contact
export const addEmergencyContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, relationship, phone, email } = req.body;

    if (!name || !relationship || !phone) {
      throw new AppError('Name, relationship, and phone are required', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    patient.emergencyContacts.push({
      name,
      relationship,
      phone,
      email,
    });

    await patient.save();

    res.status(201).json({
      success: true,
      message: 'Emergency contact added successfully',
      data: { emergencyContacts: patient.emergencyContacts },
    });
  } catch (error) {
    next(error);
  }
};

// Get lab reports
export const getLabReports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { limit = 10, page = 1 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const labReports = await EHR.find({
      patientId: patient._id,
      type: 'lab',
    })
      .sort({ date: -1 })
      .limit(Number(limit))
      .skip(skip)
      .populate('recordedBy', 'profile');

    const total = await EHR.countDocuments({
      patientId: patient._id,
      type: 'lab',
    });

    res.json({
      success: true,
      data: {
        reports: labReports,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Upload prescription (for patients to upload prescription files only)
export const uploadPrescription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { date } = req.body;

    // File is required for patient uploads
    if (!req.file) {
      throw new AppError('Prescription file is required', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    // Import upload utilities
    const { uploadToS3 } = await import('../middleware/upload.middleware');

    // Upload file to S3
    let fileUrl: string;
    try {
      fileUrl = await uploadToS3(req.file, 'prescriptions');
      logger.info(`File uploaded successfully: ${fileUrl}`);
    } catch (uploadError: any) {
      logger.error('Failed to upload prescription file:', {
        error: uploadError.message,
        stack: uploadError.stack,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      });

      // Pass through the error message from uploadToS3
      if (uploadError instanceof AppError) {
        throw uploadError;
      }
      throw new AppError(uploadError.message || 'Failed to upload prescription file', 500);
    }

    // Create prescription EHR record with file attachment only
    // Medication details will be added by doctor/lab when they review it
    const ehrData: any = {
      notes: 'Prescription uploaded by patient - pending review',
      attachments: [
        {
          type: req.file.mimetype.includes('pdf') ? 'pdf' :
            req.file.mimetype.includes('image') ? 'image' : 'document',
          url: fileUrl,
          name: req.file.originalname || 'prescription',
          uploadedAt: new Date(),
        },
      ],
    };

    const ehr = await EHR.create({
      patientId: patient._id,
      type: 'prescription',
      date: date ? new Date(date) : new Date(),
      recordedBy: user._id, // Patient uploaded it themselves
      data: ehrData,
      tags: ['patient-uploaded', 'pending-review'],
    });

    logger.info(`Prescription file uploaded by patient: ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Prescription file uploaded successfully. It will be reviewed by your doctor.',
      data: { ehr },
    });
  } catch (error) {
    next(error);
  }
};

// Generate PDF for existing prescription
export const generatePrescriptionPDF = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { ehrId } = req.params;

    logger.info(`[generatePrescriptionPDF] Starting PDF generation`, {
      userId,
      ehrId,
      path: req.path,
    });

    const user = await User.findById(userId);
    if (!user) {
      logger.error(`[generatePrescriptionPDF] User not found: ${userId}`);
      throw new AppError('User not found', 404);
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      logger.error(`[generatePrescriptionPDF] Patient profile not found for user: ${userId}`);
      throw new AppError('Patient profile not found', 404);
    }

    logger.info(`[generatePrescriptionPDF] Found patient: ${patient._id}`);

    // Find the EHR record and verify it belongs to this patient
    const ehr = await EHR.findOne({
      _id: ehrId,
      patientId: patient._id,
      type: 'prescription',
    });

    if (!ehr) {
      logger.error(`[generatePrescriptionPDF] Prescription not found`, {
        ehrId,
        patientId: patient._id,
      });
      throw new AppError('Prescription not found', 404);
    }

    logger.info(`[generatePrescriptionPDF] Found EHR record: ${ehr._id}`);

    // Check if PDF already exists
    if (ehr.data?.prescription?.pdfUrl) {
      res.json({
        success: true,
        message: 'PDF already exists',
        data: { pdfUrl: ehr.data.prescription.pdfUrl },
      });
      return;
    }

    // Get prescription data
    const prescriptionData = ehr.data?.prescription;
    if (!prescriptionData) {
      throw new AppError('Prescription data not found', 400);
    }

    // Handle both old format (single medication) and new format (medications array)
    let medications: any[] = [];
    if (prescriptionData.medications && Array.isArray(prescriptionData.medications) && prescriptionData.medications.length > 0) {
      medications = prescriptionData.medications;
    } else if (prescriptionData.medication) {
      // Old format - convert to array
      medications = [{
        name: prescriptionData.medication,
        dosage: prescriptionData.dosage || '',
        frequency: prescriptionData.frequency || '',
        duration: prescriptionData.duration || '',
        instructions: prescriptionData.instructions || '',
      }];
    }

    if (medications.length === 0) {
      logger.error('Prescription has no medications:', {
        ehrId: ehr._id,
        prescriptionData: JSON.stringify(prescriptionData),
      });
      throw new AppError('Prescription data is incomplete: No medications found', 400);
    }

    // Get patient user info
    const patientUser = await User.findById(patient.userId);
    if (!patientUser) {
      throw new AppError('Patient user not found', 404);
    }

    // Get doctor info if recordedBy exists
    let doctor = null;
    let doctorUser = null;
    if (ehr.recordedBy) {
      // Convert MongoDB ObjectId to string for User lookup
      const recordedById = typeof ehr.recordedBy === 'object'
        ? ehr.recordedBy.toString()
        : String(ehr.recordedBy);

      doctorUser = await User.findById(recordedById);
      if (doctorUser) {
        const Doctor = (await import('../models/postgres/Doctor.model')).default;
        // Convert to string for Sequelize query (PostgreSQL expects string, not ObjectId)
        doctor = await Doctor.findOne({ where: { userId: recordedById } });
      }
    }

    // Generate PDF
    const { generatePrescriptionPDF: generatePDF } = await import('../utils/pdfGenerator');
    const { uploadToS3 } = await import('../middleware/upload.middleware');

    const pdfData = {
      patientName: `${patientUser.profile?.firstName || ''} ${patientUser.profile?.lastName || ''}`.trim() || patientUser.email,
      patientAge: patientUser.profile?.dateOfBirth
        ? `${new Date().getFullYear() - new Date(patientUser.profile.dateOfBirth).getFullYear()} years`
        : undefined,
      date: ehr.date ? new Date(ehr.date).toLocaleDateString() : new Date().toLocaleDateString(),
      doctorName: doctorUser
        ? `${doctorUser.profile?.firstName || ''} ${doctorUser.profile?.lastName || ''}`.trim() || doctorUser.email
        : 'Doctor',
      doctorSpecialization: doctor?.specialization || 'General Medicine',
      doctorLicense: doctor?.licenseNumber,
      doctorContact: doctor?.contact?.phone || doctor?.contact?.email,
      medications: medications.map((m: any) => ({
        name: m.name || m.medication || 'Unknown',
        dosage: m.dosage || '',
        frequency: m.frequency || '',
        duration: m.duration || '',
        instructions: m.instructions || '',
      })),
      diagnosis: prescriptionData.diagnosis,
      notes: prescriptionData.notes,
      followUpDate: prescriptionData.followUpDate,
    };

    let pdfBuffer: Buffer;
    try {
      logger.info(`Generating PDF for prescription ${ehr._id}`);
      pdfBuffer = await generatePDF(pdfData);
      logger.info(`PDF buffer generated, size: ${pdfBuffer.length} bytes`);
    } catch (pdfError: any) {
      logger.error('Failed to generate PDF:', {
        error: pdfError.message,
        stack: pdfError.stack,
        ehrId: ehr._id,
        patientId: patient._id,
      });
      throw new AppError(`PDF generation failed: ${pdfError.message}`, 500);
    }

    // Create a file-like object for upload
    const pdfFile = {
      buffer: pdfBuffer,
      originalname: `prescription-${patient._id}-${ehr._id}-${Date.now()}.pdf`,
      mimetype: 'application/pdf',
      size: pdfBuffer.length,
    } as Express.Multer.File;

    let pdfUrl: string;
    try {
      logger.info(`Uploading PDF to S3 for prescription ${ehr._id}`);
      pdfUrl = await uploadToS3(pdfFile, 'prescriptions');
      logger.info(`Prescription PDF generated and uploaded: ${pdfUrl}`);
    } catch (uploadError: any) {
      logger.error('Failed to upload PDF to S3:', {
        error: uploadError.message,
        stack: uploadError.stack,
        ehrId: ehr._id,
        fileName: pdfFile.originalname,
        fileSize: pdfFile.size,
      });
      throw new AppError(`PDF upload failed: ${uploadError.message}`, 500);
    }

    try {
      // Update EHR with PDF URL
      ehr.data = {
        ...ehr.data,
        prescription: {
          ...ehr.data.prescription,
          pdfUrl,
        },
        attachments: [
          ...(ehr.data?.attachments || []),
          {
            type: 'pdf',
            url: pdfUrl,
            name: pdfFile.originalname,
            uploadedAt: new Date(),
          },
        ],
      };
      await ehr.save();
      logger.info(`EHR updated with PDF URL for prescription: ${ehr._id}`);
    } catch (saveError: any) {
      logger.error('Failed to save EHR with PDF URL:', {
        error: saveError.message,
        stack: saveError.stack,
        ehrId: ehr._id,
        pdfUrl,
      });
      // Don't fail the request if save fails - PDF is already uploaded
      logger.warn(`PDF uploaded but EHR save failed. PDF URL: ${pdfUrl}`);
    }

    res.json({
      success: true,
      message: 'PDF generated successfully',
      data: { pdfUrl },
    });
  } catch (error) {
    logger.error('Error in generatePrescriptionPDF:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ehrId: req.params.ehrId,
      userId: req.user?.id,
    });
    next(error);
  }
};

// Delete prescription/EHR record
export const deletePrescription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { prescriptionId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    // Find the EHR record and verify it belongs to this patient
    const ehr = await EHR.findOne({
      _id: prescriptionId,
      patientId: patient._id,
      type: 'prescription',
    });

    if (!ehr) {
      throw new AppError('Prescription not found or you do not have permission to delete it', 404);
    }

    // Only allow deletion of patient-uploaded prescriptions (not doctor-created ones)
    // Check if it was uploaded by the patient themselves
    const isPatientUploaded = ehr.recordedBy?.toString() === user._id.toString() ||
      ehr.tags?.includes('patient-uploaded');

    if (!isPatientUploaded) {
      throw new AppError('You can only delete prescriptions that you uploaded yourself', 403);
    }

    // Delete the file from storage if it exists
    if (ehr.data?.attachments && ehr.data.attachments.length > 0) {
      const attachment = ehr.data.attachments[0];
      const fileUrl = attachment.url;

      // If it's a local file, delete it
      if (fileUrl.includes('/uploads/')) {
        try {
          const { promisify } = await import('util');
          const fs = await import('fs');
          const path = await import('path');

          const urlPath = fileUrl.split('/uploads/')[1];
          const filePath = path.join(process.cwd(), 'uploads', urlPath);

          if (fs.existsSync(filePath)) {
            await promisify(fs.unlink)(filePath);
          }
        } catch (fileError) {
          logger.warn('Failed to delete file from storage:', fileError);
          // Continue with EHR deletion even if file deletion fails
        }
      }
      // TODO: If it's an S3 file, delete it from S3
    }

    // Delete the EHR record
    await EHR.findByIdAndDelete(prescriptionId);

    logger.info(`Prescription deleted by patient: ${userId}, prescriptionId: ${prescriptionId}`);

    res.json({
      success: true,
      message: 'Prescription deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get patient appointments
export const getAppointments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { status, upcoming } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    const query: any = { patientId: patient._id.toString() };

    if (status) {
      query.status = status;
    }

    if (upcoming === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Format date as YYYY-MM-DD for Sequelize DATEONLY comparison
      const todayStr = today.toISOString().split('T')[0];
      query.date = { [Op.gte]: todayStr };
      query.status = { [Op.in]: ['scheduled', 'confirmed'] };
    }

    // Check if PostgreSQL is connected
    const { sequelize } = await import('../config/database');
    try {
      await sequelize.authenticate();
    } catch (dbError) {
      // PostgreSQL not available - return empty result
      res.json({
        success: true,
        data: { appointments: [] },
        message: 'Database not available. Please configure PostgreSQL to see appointments.',
      });
      return;
    }

    const appointments = await Appointment.findAll({
      where: query,
      order: [['date', 'ASC'], ['time', 'ASC']],
      limit: upcoming === 'true' ? 10 : undefined,
    });

    // Get doctor info for each appointment
    const formattedAppointments = await Promise.all(
      appointments.map(async (apt: any) => {
        let doctorName = 'Doctor';
        let doctorSpecialization = 'General';

        try {
          const doctor = await Doctor.findByPk(apt.doctorId);
          if (doctor) {
            // Get doctor's user profile
            const doctorUser = await User.findById(doctor.userId);
            if (doctorUser && doctorUser.profile) {
              const { firstName, lastName } = doctorUser.profile;
              doctorName = `Dr. ${firstName || ''} ${lastName || ''}`.trim() || 'Doctor';
            }
            doctorSpecialization = doctor.specialization || 'General';
          }
        } catch (error) {
          logger.error(`Error fetching doctor info for appointment ${apt.id}:`, error);
        }

        let isRated = false;
        try {
          const rating = await Rating.findOne({ where: { appointmentId: apt.id } });
          isRated = !!rating;
        } catch (error) {
          logger.error(`Error checking rating for appointment ${apt.id}:`, error);
        }

        return {
          id: apt.id,
          date: apt.date,
          time: apt.time,
          type: apt.type,
          status: apt.status,
          duration: apt.duration,
          notes: apt.notes,
          meetingLink: apt.meetingLink,
          doctorName,
          doctorSpecialization,
          isRated,
          visitFee: apt.visitFee,
          vatAmount: apt.vatAmount,
          serviceCharge: apt.serviceCharge,
          feeStatus: apt.feeStatus,
          feeCurrency: apt.feeCurrency,
          paymentDeadline: apt.paymentDeadline,
        };
      })
    );

    res.json({
      success: true,
      data: { appointments: formattedAppointments },
    });
  } catch (error: any) {
    logger.error('Unhandled error in getAppointments:', error);
    // Handle Sequelize connection errors gracefully
    if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeDatabaseError') {
      res.json({
        success: true,
        data: { appointments: [] },
        message: 'Database connection error. Please configure PostgreSQL to see appointments.',
      });
      return;
    }
    next(error);
  }
};

// Get available slots for a doctor on a specific date
export const getAvailableSlots = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      throw new AppError('Doctor ID and date are required', 400);
    }

    // Verify doctor exists
    const doctor = await Doctor.findByPk(Number(doctorId));
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    // Check if doctor is available on the requested day
    const appointmentDate = new Date(date as string);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[appointmentDate.getDay()];

    if (!doctor.availability?.days || !doctor.availability.days.includes(dayOfWeek)) {
      res.json({
        success: true,
        data: { slots: [] },
        message: `Doctor is not available on ${dayOfWeek}.`
      });
      return;
    }

    // Get doctor's availability hours
    const start = doctor.availability?.hours?.start || '09:00';
    const end = doctor.availability?.hours?.end || '17:00';

    // Generate all potential slots (every 30 mins)
    const allSlots: string[] = [];
    let [h, m] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);

    while (h < eh || (h === eh && m < em)) {
      allSlots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      m += 30;
      if (m >= 60) {
        h++;
        m = 0;
      }
    }

    // Get existing appointments for this doctor and date
    const existingAppointments = await Appointment.findAll({
      where: {
        doctorId: Number(doctorId),
        date: date as string,
        status: { [Op.in]: ['scheduled', 'confirmed'] },
      },
      attributes: ['time']
    });

    const bookedTimes = existingAppointments.map(apt => apt.time);

    // Filter available slots
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    res.json({
      success: true,
      data: { slots: availableSlots }
    });
  } catch (error) {
    next(error);
  }
};

// Book appointment (for patients)
export const bookAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { doctorId, date, time, type, duration, notes } = req.body;

    if (!doctorId || !date || !time) {
      throw new AppError('Doctor ID, date, and time are required', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    // Check if PostgreSQL is connected
    const { sequelize } = await import('../config/database');
    try {
      await sequelize.authenticate();
    } catch (dbError) {
      throw new AppError('Database not available. Please configure PostgreSQL to book appointments.', 503);
    }

    // Verify doctor exists
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    if (!doctor.isActive) {
      throw new AppError('Doctor is not currently active. Please choose another doctor.', 400);
    }

    // Check if doctor is available on the requested day
    const appointmentDate = new Date(date);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[appointmentDate.getDay()];

    if (!doctor.availability?.days || !doctor.availability.days.includes(dayOfWeek)) {
      throw new AppError(
        `Doctor is not available on ${dayOfWeek}. Available days: ${doctor.availability?.days?.join(', ') || 'Not set'}.`,
        400
      );
    }

    // Check if time is within doctor's availability hours
    if (doctor.availability?.hours) {
      const { start, end } = doctor.availability.hours;
      const [requestHour, requestMinute] = time.split(':').map(Number);
      const [startHour, startMinute] = start.split(':').map(Number);
      const [endHour, endMinute] = end.split(':').map(Number);

      const requestTime = requestHour * 60 + requestMinute;
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      if (requestTime < startTime || requestTime >= endTime) {
        throw new AppError(
          `Doctor is only available between ${start} and ${end}. Please choose a time within this range.`,
          400
        );
      }
    }

    // Check if slot is already booked
    const existingAppointment = await Appointment.findOne({
      where: {
        doctorId: Number(doctorId),
        date,
        time,
        status: { [Op.in]: ['scheduled', 'confirmed'] },
      },
    });

    if (existingAppointment) {
      throw new AppError('This time slot is already booked. Please choose another time.', 409);
    }

    // Calculate fees
    const visitFee = doctor.consultationFee || 0;
    const vatAmount = Number((visitFee * 0.05).toFixed(2)); // 5% VAT
    const serviceCharge = Number((visitFee * 0.02).toFixed(2)); // 2% Service Charge

    // Create appointment
    const appointment = await Appointment.create({
      patientId: patient._id.toString(),
      doctorId: Number(doctorId),
      date,
      time,
      type: type || 'in-person',
      duration: duration || 30,
      notes,
      status: 'scheduled',
      visitFee,
      vatAmount,
      serviceCharge,
      feeStatus: 'unpaid',
      feeCurrency: 'BDT',
      paymentDeadline: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes deadline
    });

    // Create Unified Payment Record
    try {
      const doctorUser = doctor ? await User.findById(doctor.userId) : null;
      const dName = `${doctorUser?.profile?.firstName || 'Doctor'} ${doctorUser?.profile?.lastName || ''}`.trim();

      await UnifiedPayment.create({
        serviceType: 'doctor',
        serviceId: appointment.id.toString(),
        patientId: patient._id,
        providerId: doctor.userId,
        baseAmount: visitFee,
        vatAmount: vatAmount,
        serviceCharge: serviceCharge,
        totalAmount: visitFee + vatAmount + serviceCharge,
        itemBreakdown: [{
          name: `Consultation - ${dName}`,
          quantity: 1,
          unitPrice: visitFee,
          total: visitFee
        }],
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        metadata: {
          doctorName: dName,
          appointmentDate: new Date(date)
        }
      });
    } catch (payError) {
      console.error('Unified Payment Creation Error:', payError);
      // We don't throw here to avoid breaking appointment booking if payment record fails
      // though in a real system this should be atomic
    }

    logger.info(`Appointment booked by patient ${userId} with doctor ${doctorId}`);

    // Send notifications
    try {
      // Fetch doctor's user record to get name
      // doctor is a Sequelize instance, doctor.userId is the Mongo User ID string
      const doctorUser = doctor ? await User.findById(doctor.userId) : null;
      // Fetch patient's user record (req.user is just JWT payload)
      const patientUser = await User.findById(userId);

      const pName = `${patientUser?.profile?.firstName || 'Patient'} ${patientUser?.profile?.lastName || ''}`.trim();
      const dName = `${doctorUser?.profile?.firstName || 'Doctor'} ${doctorUser?.profile?.lastName || ''}`.trim();

      await notifyAppointmentBooked(
        getIO(),
        userId,
        doctor.userId,
        appointment.id,
        date,
        time,
        dName,
        pName
      );
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: { appointment },
    });
  } catch (error: any) {
    // Handle Sequelize connection errors gracefully
    if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeDatabaseError') {
      res.status(503).json({
        success: false,
        message: 'Database connection error. Please configure PostgreSQL to book appointments.',
      });
      return;
    }
    next(error);
  }
};

// Rate doctor after appointment
export const rateDoctor = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const appointmentIdParam = req.params.appointmentId; // Get from URL parameter
    const { rating, comment } = req.body;

    if (!appointmentIdParam || !rating) {
      throw new AppError('Appointment ID and rating are required', 400);
    }

    // Convert appointmentId to number
    const appointmentId = parseInt(appointmentIdParam, 10);
    if (isNaN(appointmentId)) {
      throw new AppError('Invalid appointment ID', 400);
    }

    if (rating < 1 || rating > 5) {
      throw new AppError('Rating must be between 1 and 5', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    // Check if PostgreSQL is connected
    const { sequelize } = await import('../config/database');
    try {
      await sequelize.authenticate();
    } catch (dbError) {
      throw new AppError('Database not available. Please configure PostgreSQL.', 503);
    }

    // Verify appointment exists and belongs to patient
    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (appointment.patientId !== patient._id.toString()) {
      throw new AppError('Unauthorized', 403);
    }

    if (appointment.status !== 'completed') {
      throw new AppError('Can only rate completed appointments', 400);
    }

    // Check if rating already exists
    const existingRating = await Rating.findOne({ where: { appointmentId } });
    if (existingRating) {
      throw new AppError('You have already rated this appointment', 400);
    }

    // Create rating
    const newRating = await Rating.create({
      appointmentId,
      doctorId: appointment.doctorId,
      patientId: patient._id.toString(),
      rating,
      comment,
    });

    // Update doctor's average rating
    const doctor = await Doctor.findByPk(appointment.doctorId);
    if (doctor) {
      const allRatings = await Rating.findAll({ where: { doctorId: appointment.doctorId } });
      const totalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / allRatings.length;
      if (averageRating) {
        await doctor.update({
          rating: Number(averageRating.toFixed(2)),
          totalReviews: allRatings.length,
        });
      }
    }

    logger.info(`Rating submitted for appointment ${appointmentId} by patient ${userId}`);

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: { rating: newRating },
    });
  } catch (error) {
    next(error);
  }
};

// Delete patient account
export const deleteAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { password } = req.body;

    if (!password) {
      throw new AppError('Password is required to delete account', 400);
    }

    // Verify user and password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid password', 401);
    }

    // Find patient profile
    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    // Delete all EHR records and their associated files
    const ehrRecords = await EHR.find({ patientId: patient._id });

    for (const ehr of ehrRecords) {
      // Delete associated files
      if (ehr.data?.attachments && ehr.data.attachments.length > 0) {
        for (const attachment of ehr.data.attachments) {
          const fileUrl = attachment.url;

          try {
            // Delete from local storage
            if (fileUrl.includes('/uploads/')) {
              const { promisify } = await import('util');
              const fs = await import('fs');
              const path = await import('path');

              const urlPath = fileUrl.split('/uploads/')[1];
              const filePath = path.join(process.cwd(), 'uploads', urlPath);

              if (fs.existsSync(filePath)) {
                await promisify(fs.unlink)(filePath);
                logger.info(`Deleted local file: ${filePath}`);
              }
            }
            // Delete from S3 if it's an S3 URL
            else if (fileUrl.includes('amazonaws.com') || fileUrl.includes('s3.')) {
              try {
                const AWS = await import('aws-sdk');
                const s3 = new AWS.S3({
                  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                  region: process.env.AWS_REGION || 'us-east-1',
                });

                // Extract key from URL
                const urlParts = fileUrl.split('/');
                const key = urlParts.slice(urlParts.indexOf(process.env.AWS_S3_BUCKET || 'healthlife-storage') + 1).join('/');

                await s3.deleteObject({
                  Bucket: process.env.AWS_S3_BUCKET || 'healthlife-storage',
                  Key: key,
                }).promise();
                logger.info(`Deleted S3 file: ${key}`);
              } catch (s3Error) {
                logger.warn('Failed to delete S3 file:', s3Error);
                // Continue even if S3 deletion fails
              }
            }
          } catch (fileError) {
            logger.warn('Failed to delete file:', fileError);
            // Continue with account deletion even if file deletion fails
          }
        }
      }
    }

    // Delete all EHR records
    await EHR.deleteMany({ patientId: patient._id });
    logger.info(`Deleted ${ehrRecords.length} EHR records for patient ${patient._id}`);

    // Delete all appointments (PostgreSQL)
    try {
      const { sequelize } = await import('../config/database');
      await sequelize.authenticate();

      const deletedAppointments = await Appointment.destroy({
        where: { patientId: patient._id.toString() },
      });
      logger.info(`Deleted ${deletedAppointments} appointments for patient ${patient._id}`);
    } catch (dbError) {
      logger.warn('PostgreSQL not available, skipping appointment deletion:', dbError);
      // Continue even if PostgreSQL is not available
    }

    // Delete patient profile
    await Patient.findByIdAndDelete(patient._id);
    logger.info(`Deleted patient profile: ${patient._id}`);

    // Delete user account
    await User.findByIdAndDelete(user._id);
    logger.info(`Deleted user account: ${user._id}`);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get all labs (for patient to select) with prices
export const getAllLabs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { testCodes } = req.query; // Comma-separated test codes to get prices for

    // Try multiple query variations to find labs
    let labs = await User.find({ role: 'lab' })
      .select('_id email profile role')
      .lean();

    // If no labs found, try case-insensitive search
    if (labs.length === 0) {
      labs = await User.find({ role: { $regex: /^lab$/i } })
        .select('_id email profile role')
        .lean();
    }

    if (labs.length === 0) {
      if (logger) {
        logger.warn('No lab users found in database');
      }
    }

    // Import TestPrice model
    const TestPrice = (await import('../models/mongodb/TestPrice.model')).default;

    // Format labs for frontend with prices
    const formattedLabs = await Promise.all(
      labs.map(async (lab: any) => {
        // Ensure profile exists with defaults
        const profile = lab.profile || {};
        const location = profile.location;
        const locationStr = location
          ? [location.city, location.state, location.country].filter(Boolean).join(', ')
          : null;

        // Get lab name - use profile name exclusively if available
        const labName = profile.firstName
          ? `${profile.firstName} ${profile.lastName || ''}`.trim()
          : lab.email?.split('@')[0] || 'Medical Laboratory';

        // Get all active prices for this lab
        const allPriceRecords = await TestPrice.find({
          labId: lab._id,
          active: true
        }).lean();

        let totalPrice = 0;
        let matchedCodes: string[] = [];

        if (testCodes && typeof testCodes === 'string') {
          // Calculate total price for requested tests
          const testItems = testCodes.split(',').map((c: string) => c.trim());
          const codesUpper = testItems.map((c: string) => c.toUpperCase());

          const extractedCodes: string[] = [];
          testItems.forEach((item: string) => {
            const match = item.match(/\(([^)]+)\)/);
            if (match && match[1]) {
              extractedCodes.push(match[1].trim().toUpperCase());
            }
            if (item.length <= 10 && /^[A-Z0-9\s-]+$/i.test(item)) {
              extractedCodes.push(item.toUpperCase());
            }
          });

          const allCodesToSearch = [...new Set([...codesUpper, ...extractedCodes])];

          // Filter records that match
          const matchedRecords = allPriceRecords.filter((p: any) => {
            const codeMatch = allCodesToSearch.includes(p.testCode?.toUpperCase());

            // Name match
            let nameMatch = false;
            if (p.testName) {
              const normPName = p.testName.toLowerCase();
              nameMatch = testItems.some((item: string) => {
                // Simple contains check for flexibility
                return normPName.includes(item.toLowerCase()) || item.toLowerCase().includes(normPName);
              });
            }

            return codeMatch || nameMatch;
          });

          totalPrice = matchedRecords.reduce((sum: number, p: any) => sum + (p.price || 0), 0);
          matchedCodes = matchedRecords.map((p: any) => p.testCode);
        }

        // Return ALL prices for browsing
        const prices = allPriceRecords.map((p: any) => ({
          testCode: p.testCode,
          testName: p.testName,
          price: p.price,
          isMatch: matchedCodes.includes(p.testCode) // Flag to help frontend highlight
        }));

        return {
          _id: lab._id.toString(),
          id: lab._id.toString(),
          email: lab.email,
          profile: {
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            ...profile,
          },
          labName,
          location: locationStr,
          prices,
          totalPrice,
        };
      })
    );

    if (logger) {
      logger.info(`Fetched ${formattedLabs.length} lab users with prices for patient selection`);
    }

    res.json({
      success: true,
      data: { labs: formattedLabs },
    });
  } catch (error: any) {
    if (logger) {
      logger.error('Error fetching labs for patient:', error);
    }
    next(error);
  }
};

// Get patient's lab test requests
export const getLabTestRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    let requests = await EHR.find({
      patientId: patient._id,
      type: 'lab-test-request',
    })
      .populate({
        path: 'recordedBy',
        select: 'email profile',
        model: 'User',
      })
      .populate({
        path: 'data.labTestRequest.labId',
        select: 'email profile',
        model: 'User',
      })
      .sort({ date: -1 })
      .lean();

    // Import TestPrice model
    const TestPrice = (await import('../models/mongodb/TestPrice.model')).default;

    // Calculate prices for assigned requests
    requests = await Promise.all(requests.map(async (request: any) => {
      const labRequest = request.data?.labTestRequest;

      // Only calculate price if assigned to a lab and has tests
      if (labRequest?.labId && (labRequest.status === 'ASSIGNED' || labRequest.status === 'completed') && labRequest.tests?.length > 0) {
        try {
          const labId = labRequest.labId._id || labRequest.labId; // Handle both populated and unpopulated
          const testItems = labRequest.tests.map((t: any) =>
            typeof t === 'string' ? t : (t.testCode || t.name || t.testName)
          ).filter(Boolean);

          if (testItems.length > 0) {
            const codesUpper = testItems.map((c: string) => c.toUpperCase());
            // Extract test codes from names (e.g., "Complete Blood Count (CBC)" -> "CBC")
            const extractedCodes: string[] = [];
            testItems.forEach((item: string) => {
              const match = item.match(/\(([^)]+)\)/);
              if (match && match[1]) {
                extractedCodes.push(match[1].trim().toUpperCase());
              }
              if (item.length <= 10 && /^[A-Z0-9\s-]+$/i.test(item)) {
                extractedCodes.push(item.toUpperCase());
              }
            });

            // Build $or conditions for testName matching
            const testNameConditions = testItems.map((name: string) => {
              const normalizedName = name.replace(/\s*\(\s*/g, '\\s*\\(\\s*').replace(/\s*\)\s*/g, '\\s*\\)\\s*');
              return {
                testName: { $regex: normalizedName.replace(/[.*+?^${}|[\]\\]/g, '\\$&'), $options: 'i' }
              };
            });

            const allCodesToSearch = [...new Set([...codesUpper, ...extractedCodes])];

            const priceRecords = await TestPrice.find({
              labId: labId,
              active: true,
              $or: [
                { testCode: { $in: allCodesToSearch } },
                ...testNameConditions
              ]
            }).lean();

            // Calculate total and create breakdown
            const prices = priceRecords.map((p: any) => ({
              testName: p.testName,
              price: p.price
            }));
            const totalPrice = priceRecords.reduce((sum: number, p: any) => sum + (p.price || 0), 0);

            if (!request.data.labTestRequest) request.data.labTestRequest = {};
            request.data.labTestRequest.estimatedCost = totalPrice;
            request.data.labTestRequest.priceBreakdown = prices;
          }
        } catch (err) {
          console.error(`Error calculating price for request ${request._id}:`, err);
        }
      }
      return request;
    }));

    res.json({
      success: true,
      data: { requests },
    });
  } catch (error) {
    next(error);
  }
};

// Generate PDF for lab result (patient can generate)
export const generateLabResultPDF = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { ehrId } = req.params;

    if (logger) {
      logger.info(`[generateLabResultPDF] Starting PDF generation`, { userId, ehrId });
    }

    const user = await User.findById(userId);
    if (!user) {
      if (logger) {
        logger.error(`[generateLabResultPDF] User not found: ${userId}`);
      }
      throw new AppError('User not found', 404);
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      if (logger) {
        logger.error(`[generateLabResultPDF] Patient profile not found for user: ${userId}`);
      }
      throw new AppError('Patient profile not found', 404);
    }

    // Find the lab result EHR record and verify it belongs to this patient
    const labResult = await EHR.findOne({
      _id: ehrId,
      patientId: patient._id,
      type: 'lab',
    });

    if (!labResult) {
      if (logger) {
        logger.error(`[generateLabResultPDF] Lab result not found`, { ehrId, patientId: patient._id });
      }
      throw new AppError('Lab result not found', 404);
    }

    if (logger) {
      logger.info(`[generateLabResultPDF] Found lab result`, {
        labResultId: labResult._id,
        hasLabResults: !!labResult.data?.labResults,
        labResultsCount: labResult.data?.labResults?.length
      });
    }

    // Check if PDF already exists
    const existingPdf = labResult.data?.attachments?.find((att: any) => att.type === 'pdf');
    if (existingPdf) {
      res.json({
        success: true,
        message: 'PDF already exists',
        data: { pdfUrl: existingPdf.url },
      });
      return;
    }

    // Get lab user info
    const labUser = labResult.recordedBy
      ? await User.findById(labResult.recordedBy)
      : null;

    // Get doctor info if there's a related request
    let doctorUser = null;
    const relatedRequest = await EHR.findOne({
      patientId: labResult.patientId,
      type: 'lab-test-request',
      'data.labTestRequest.status': 'completed',
    }).sort({ date: -1 });

    if (relatedRequest?.recordedBy) {
      doctorUser = await User.findById(relatedRequest.recordedBy);
    }

    // Check if lab results exist
    if (!labResult.data?.labResults || !Array.isArray(labResult.data.labResults) || labResult.data.labResults.length === 0) {
      if (logger) {
        logger.error(`[generateLabResultPDF] Lab result has no test results`, { labResultId: labResult._id });
      }
      throw new AppError('Lab result has no test data', 400);
    }

    // Generate PDF
    const { generateLabResultPDF: generatePDF } = await import('../utils/pdfGenerator');
    const { uploadToS3 } = await import('../middleware/upload.middleware');

    const pdfData = {
      patientName: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.email,
      patientAge: user.profile?.dateOfBirth
        ? `${new Date().getFullYear() - new Date(user.profile.dateOfBirth).getFullYear()} years`
        : undefined,
      date: labResult.date ? new Date(labResult.date).toLocaleDateString() : new Date().toLocaleDateString(),
      labName: labUser
        ? `${labUser.profile?.firstName || ''} ${labUser.profile?.lastName || ''}`.trim() || labUser.email
        : 'Laboratory',
      labContact: labUser?.email,
      testResults: labResult.data.labResults.map((result: any) => ({
        testName: result.testName || 'Unknown Test',
        value: result.value || 0,
        unit: result.unit || '',
        normalRange: result.normalRange || { min: 0, max: 100 },
        status: result.status || 'normal',
      })),
      requestedBy: doctorUser
        ? `Dr. ${doctorUser.profile?.firstName || ''} ${doctorUser.profile?.lastName || ''}`.trim() || doctorUser.email
        : undefined,
    };

    if (logger) {
      logger.info(`[generateLabResultPDF] Generating PDF with data`, {
        testResultsCount: pdfData.testResults.length,
        patientName: pdfData.patientName,
        labName: pdfData.labName
      });
    }

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generatePDF(pdfData);
      if (logger) {
        logger.info(`[generateLabResultPDF] PDF buffer generated`, { size: pdfBuffer.length });
      }
    } catch (pdfError: any) {
      if (logger) {
        logger.error(`[generateLabResultPDF] PDF generation failed`, {
          error: pdfError.message,
          stack: pdfError.stack,
        });
      }
      throw new AppError(`PDF generation failed: ${pdfError.message}`, 500);
    }

    const pdfFile = {
      buffer: pdfBuffer,
      originalname: `lab-result-${patient._id}-${labResult._id}-${Date.now()}.pdf`,
      mimetype: 'application/pdf',
      size: pdfBuffer.length,
    } as Express.Multer.File;

    let pdfUrl: string;
    try {
      pdfUrl = await uploadToS3(pdfFile, 'lab-results');
      if (logger) {
        logger.info(`[generateLabResultPDF] PDF uploaded to S3`, { pdfUrl });
      }
    } catch (uploadError: any) {
      if (logger) {
        logger.error(`[generateLabResultPDF] S3 upload failed`, {
          error: uploadError.message,
          stack: uploadError.stack,
        });
      }
      throw new AppError(`PDF upload failed: ${uploadError.message}`, 500);
    }

    // Update lab result with PDF URL
    try {
      labResult.data = {
        ...labResult.data,
        attachments: [
          ...(labResult.data?.attachments || []),
          {
            type: 'pdf',
            url: pdfUrl,
            name: pdfFile.originalname,
            uploadedAt: new Date(),
          },
        ],
      };
      await labResult.save();
      if (logger) {
        logger.info(`[generateLabResultPDF] Lab result updated with PDF URL`);
      }
    } catch (saveError: any) {
      if (logger) {
        logger.error(`[generateLabResultPDF] Failed to save lab result`, {
          error: saveError.message,
          pdfUrl,
        });
      }
      // Don't fail the request if save fails - PDF is already uploaded
    }

    if (logger) {
      logger.info(`[generateLabResultPDF] Lab result PDF generated successfully for patient ${userId}: ${pdfUrl}`);
    }

    res.json({
      success: true,
      message: 'PDF generated successfully',
      data: { pdfUrl },
    });
  } catch (error: any) {
    if (logger) {
      logger.error(`[generateLabResultPDF] Error in generateLabResultPDF`, {
        error: error.message,
        stack: error.stack,
        ehrId: req.params.ehrId,
        userId: req.user?.id,
      });
    }
    next(error);
  }
};

// Assign lab to a lab test request
export const assignLabToRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { requestId, labId } = req.body;

    if (!requestId || !labId) {
      throw new AppError('Request ID and Lab ID are required', 400);
    }

    // Find the request
    const request = await EHR.findById(requestId);
    if (!request || request.type !== 'lab-test-request') {
      throw new AppError('Lab test request not found', 404);
    }

    // Verify user is patient or doctor who created the request
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if user is the patient
    const patient = await Patient.findOne({ userId: user._id });
    const isPatient = patient && patient._id.toString() === request.patientId.toString();

    // Check if user is the doctor who created the request
    const isDoctor = request.recordedBy && request.recordedBy.toString() === userId;

    if (!isPatient && !isDoctor) {
      throw new AppError('You do not have permission to assign labs to this request', 403);
    }

    // Verify lab exists and is a lab user
    const labUser = await User.findOne({ _id: labId, role: 'lab' });
    if (!labUser) {
      throw new AppError('Lab not found', 404);
    }

    // Check if already assigned
    if (request.data?.labTestRequest?.status === 'ASSIGNED' || request.data?.labTestRequest?.status === 'completed') {
      throw new AppError('Request is already assigned or completed', 400);
    }

    // Update request
    if (request.data && request.data.labTestRequest) {
      const labTestRequest = request.data.labTestRequest;
      labTestRequest.status = 'ASSIGNED';
      labTestRequest.labId = new mongoose.Types.ObjectId(labId);
      labTestRequest.assignedAt = new Date();
      labTestRequest.assignedBy = new mongoose.Types.ObjectId(userId);
      request.tags = (request.tags || []).filter((tag: string) => tag !== 'REQUESTED');
      request.tags.push('ASSIGNED');
      request.markModified('data');
      await request.save();

      // Create Unified Payment Record for the assigned lab
      try {
        const tests = request.data.labTestRequest.tests || [];
        const baseAmount = tests.reduce((sum: number, t: any) => sum + (t.price || 0), 0);
        const vatAmount = Math.round(baseAmount * 0.05);
        const serviceCharge = Math.round(baseAmount * 0.02);
        const labName = labUser?.profile?.firstName ? `${labUser.profile.firstName} ${labUser.profile.lastName || ''}`.trim() : 'Laboratory';

        await UnifiedPayment.create({
          serviceType: 'lab',
          serviceId: request._id,
          patientId: request.patientId,
          providerId: labId,
          baseAmount,
          vatAmount,
          serviceCharge,
          totalAmount: baseAmount + vatAmount + serviceCharge,
          itemBreakdown: tests.map((t: any) => ({
            name: t.testName || t.name || 'Lab Test',
            quantity: 1,
            unitPrice: t.price || 0,
            total: t.price || 0
          })),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          metadata: {
            labName,
            testNames: tests.map((t: any) => t.testName || t.name || 'Lab Test')
          }
        });
      } catch (payError) {
        console.error('Unified Payment Creation Error (assignLab):', payError);
      }
    }

    // Send notification to Lab
    try {
      const assignerName = `${user.profile?.firstName || 'Patient'} ${user.profile?.lastName || ''}`.trim();
      if (getIO()) {
        await notifyLabRequestAssigned(getIO(), labId, request._id.toString(), assignerName);
      }
    } catch (error) {
      console.error('Notification error:', error);
    }

    if (logger) {
      logger.info(`Lab ${labId} assigned to request ${requestId} by ${userId}`);
    }

    res.json({
      success: true,
      message: 'Lab assigned successfully',
      data: { request },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Initiate payment for an appointment
 */
export const initiatePayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id; // MongoDB User ID
    const { appointmentId } = req.params;

    if (!appointmentId) {
      throw new AppError('Appointment ID is required', 400);
    }

    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Verify ownership
    const patient = await Patient.findOne({ userId });
    if (!patient || appointment.patientId !== patient._id.toString()) {
      throw new AppError('Unauthorized access to this appointment', 403);
    }

    if (appointment.feeStatus === 'paid') {
      throw new AppError('Appointment is already paid', 400);
    }

    // Update status to pending
    appointment.feeStatus = 'pending';
    await appointment.save();

    res.json({
      success: true,
      message: 'Payment initiated',
      data: {
        appointmentId: appointment.id,
        fee: appointment.visitFee,
        vat: appointment.vatAmount,
        serviceCharge: appointment.serviceCharge,
        total: Number(appointment.visitFee || 0) + Number(appointment.vatAmount || 0) + Number(appointment.serviceCharge || 0),
        currency: appointment.feeCurrency,
        feeStatus: appointment.feeStatus,
        paymentDeadline: appointment.paymentDeadline,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Pay for an appointment fee (Simulated)
 */
export const payAppointmentFee = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id; // MongoDB User ID
    const { appointmentId } = req.params;
    const { paymentMethod = 'card' } = req.body;

    if (!appointmentId) {
      throw new AppError('Appointment ID is required', 400);
    }

    // Find appointment in PostgreSQL
    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Verify appointment belongs to patient
    // We need to find the patient record for this user
    const patient = await Patient.findOne({ userId });
    if (!patient || appointment.patientId !== patient._id.toString()) {
      throw new AppError('Unauthorized: This appointment does not belong to you', 403);
    }

    if (appointment.feeStatus === 'paid') {
      throw new AppError('Fee has already been paid', 400);
    }

    if (!appointment.visitFee) {
      throw new AppError('No fee recorded for this appointment', 400);
    }

    // SIMULATED PAYMENT PROCESSING
    // In a real app, integrate with Stripe/SSLCommerz here
    const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const totalAmount = Number(appointment.visitFee || 0) + Number(appointment.vatAmount || 0) + Number(appointment.serviceCharge || 0);

    // Update appointment status
    appointment.feeStatus = 'paid';
    appointment.status = 'confirmed'; // Auto-confirm on success
    await appointment.save();

    if (logger) {
      logger.info(`Payment received for appointment ${appointmentId}. Transaction: ${transactionId}`);
    }

    // Record Revenue Transaction
    try {
      const doctor = await Doctor.findByPk(appointment.doctorId);
      if (doctor) {
        await RevenueTransaction.create({
          type: 'doctor',
          amount: totalAmount,
          currency: appointment.feeCurrency || 'BDT',
          patientUserId: userId,
          providerUserId: doctor.userId,
          serviceId: appointment.id.toString(),
          transactionId: transactionId,
          paymentMethod: paymentMethod,
          status: 'completed',
          date: new Date(),
          metadata: {
            appointmentDate: appointment.date,
            appointmentTime: appointment.time,
            breakdown: {
              fee: appointment.visitFee,
              vat: appointment.vatAmount,
              serviceCharge: appointment.serviceCharge,
            }
          }
        });
      }
    } catch (revError) {
      logger.error('Failed to record revenue transaction:', revError);
    }

    res.json({
      success: true,
      message: 'Payment processed successfully and appointment confirmed',
      data: {
        appointment,
        transactionId,
        amount: totalAmount,
        currency: appointment.feeCurrency,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Cancel appointment
export const cancelAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { appointmentId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    // Import Appointment model
    const Appointment = (await import('../models/postgres/Appointment.model')).default;

    const appointment = await Appointment.findOne({
      where: {
        id: appointmentId,
        patientId: patient.id
      }
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (appointment.status === 'cancelled') {
      throw new AppError('Appointment is already cancelled', 400);
    }

    if (appointment.status === 'completed') {
      throw new AppError('Cannot cancel a completed appointment', 400);
    }

    // Update status to cancelled
    await appointment.update({ status: 'cancelled' });

    // Send notifications
    try {
      // We need doctor details for the message
      const notificationDoctor = appointment.doctorId ? await Doctor.findByPk(appointment.doctorId) : null;
      const notificationDoctorUser = notificationDoctor ? await User.findById(notificationDoctor.userId) : null;
      // Fetch patient details (req.user is just JWT payload)
      const notificationPatientUser = await User.findById(userId);

      const dName = `${notificationDoctorUser?.profile?.firstName || 'Doctor'} ${notificationDoctorUser?.profile?.lastName || ''}`.trim();
      const pName = `${notificationPatientUser?.profile?.firstName || 'Patient'} ${notificationPatientUser?.profile?.lastName || ''}`.trim();

      await notifyAppointmentCancelled(
        getIO(),
        userId,
        notificationDoctor!.userId,
        appointment.id,
        appointment.date instanceof Date ? appointment.date.toISOString().split('T')[0] : String(appointment.date),
        dName,
        pName,
        'patient'
      );
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

// Create a new lab test order (booking)
export const createLabOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { labId, testIds, urgency = 'routine', notes } = req.body;

    if (!labId || !testIds || !Array.isArray(testIds) || testIds.length === 0) {
      throw new AppError('Lab ID and at least one test ID are required', 400);
    }

    const patient = await Patient.findOne({ userId });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    // Verify lab exists
    const labUser = await User.findOne({ _id: labId, role: 'lab' });
    if (!labUser) {
      throw new AppError('Selected laboratory not found', 404);
    }

    // Verify tests and get details
    const prices = await TestPrice.find({
      _id: { $in: testIds },
      labId,
      active: true,
    }).lean();

    if (prices.length !== testIds.length) {
      throw new AppError('Some selected tests are unavailable or do not belong to the selected laboratory', 400);
    }

    const tests = prices.map(p => ({
      name: p.testName,
      testCode: p.testCode,
      price: p.price
    }));

    // Create the order (EHR request)
    const ehr = await EHR.create({
      patientId: patient._id,
      type: 'lab-test-request',
      date: new Date(),
      recordedBy: userId, // Created by patient
      data: {
        labTestRequest: {
          tests,
          labId: new mongoose.Types.ObjectId(labId),
          urgency,
          notes,
          status: 'pending', // Pending payment
          requestedAt: new Date(),
        }
      },
      tags: ['REQUESTED', 'PENDING_PAYMENT']
    });

    // Create Unified Payment Record
    try {
      const baseAmount = tests.reduce((sum, t) => sum + t.price, 0);
      const vatAmount = Math.round(baseAmount * 0.05);
      const serviceCharge = Math.round(baseAmount * 0.02);
      const labName = labUser?.profile?.firstName ? `${labUser.profile.firstName} ${labUser.profile.lastName || ''}`.trim() : 'Laboratory';

      await UnifiedPayment.create({
        serviceType: 'lab',
        serviceId: ehr._id,
        patientId: patient._id,
        providerId: labId,
        baseAmount,
        vatAmount,
        serviceCharge,
        totalAmount: baseAmount + vatAmount + serviceCharge,
        itemBreakdown: tests.map(t => ({
          name: t.name || 'Lab Test',
          quantity: 1,
          unitPrice: t.price,
          total: t.price
        })),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        metadata: {
          labName,
          testNames: tests.map(t => t.name || 'Lab Test')
        }
      });
    } catch (payError) {
      console.error('Unified Payment Creation Error (createLabOrder):', payError);
    }

    if (logger) {
      logger.info(`Lab order ${ehr._id} created by patient ${userId} for lab ${labId}`);
    }

    res.status(201).json({
      success: true,
      message: 'Lab order created successfully. Please proceed to payment.',
      data: {
        orderId: ehr._id,
        totalAmount: tests.reduce((sum, t) => sum + t.price, 0),
        tests
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all lab test orders (history) for patient
export const getLabOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { status, page = 1, limit = 20 } = req.query;

    const patient = await Patient.findOne({ userId });
    if (!patient) {
      throw new AppError('Patient profile not found', 404);
    }

    const query: any = {
      patientId: patient._id,
      type: 'lab-test-request'
    };

    if (status) {
      query['data.labTestRequest.status'] = status;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const orders = await EHR.find(query)
      .populate('recordedBy', 'profile email') // Assumes it could be a doctor or patient
      .populate({
        path: 'data.labTestRequest.labId',
        model: 'User',
        select: 'profile email'
      })
      .populate({
        path: 'data.labTestRequest.paymentId',
        model: 'Payment'
      })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(Number(limit))
      .lean();

    const total = await EHR.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
