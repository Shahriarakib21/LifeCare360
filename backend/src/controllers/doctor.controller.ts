import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/mongodb/User.model';
import Patient from '../models/mongodb/Patient.model';
import EHR from '../models/mongodb/EHR.model';
import Doctor from '../models/postgres/Doctor.model';
import Appointment from '../models/postgres/Appointment.model';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';
import { getIO } from '../utils/socket';
import {
  notifyPrescriptionCreated,
  notifyTestOrdered,
  notifyAppointmentBooked,
  notifyAppointmentCancelled
} from '../utils/notifications';


// Get doctor profile
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

    // Check if PostgreSQL is connected
    const { sequelize } = await import('../config/database');
    try {
      await sequelize.authenticate();
    } catch (dbError) {
      logger.error('PostgreSQL connection error in getProfile:', dbError);
      // Return user data without doctor profile if PostgreSQL is unavailable
      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            profile: user.profile,
          },
          doctor: null,
        },
        message: 'Database not available. Please configure PostgreSQL.',
      });
      return;
    }

    const doctor = await Doctor.findOne({ where: { userId } });
    // If doctor profile doesn't exist in PostgreSQL, return a default/empty one
    // This allows the frontend to display a "create profile" message
    if (!doctor) {
      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            profile: user.profile,
          },
          doctor: null, // Indicate no doctor profile yet
        },
        message: 'Doctor profile not found. Please update your profile to create one.',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          profile: user.profile,
        },
        doctor: doctor.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update doctor profile (or create if doesn't exist)
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const updates: any = { ...req.body };

    // Handle profile image upload
    if (req.file) {
      try {
        const { uploadToS3 } = await import('../middleware/upload.middleware');
        const imageUrl = await uploadToS3(req.file, 'doctor-profiles');
        updates.profileImage = imageUrl;
        logger.info(`Profile image uploaded for doctor ${userId}: ${imageUrl}`);
      } catch (uploadError: any) {
        logger.error('Failed to upload profile image:', uploadError);
        throw new AppError(uploadError.message || 'Failed to upload profile image', 500);
      }
    }

    let doctor = await Doctor.findOne({ where: { userId } });

    if (!doctor) {
      // Create doctor profile if it doesn't exist
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Check if PostgreSQL is available
      const { sequelize } = await import('../config/database');
      try {
        await sequelize.authenticate();
      } catch (dbError) {
        throw new AppError('Database not available. Please configure PostgreSQL.', 503);
      }

      // Create new doctor profile with provided data or defaults
      doctor = await Doctor.create({
        userId: user._id.toString(),
        specialization: updates.specialization || 'General Medicine',
        qualifications: updates.qualifications || [],
        experience: updates.experience || 0,
        licenseNumber: updates.licenseNumber || `TEMP-${Date.now()}`,
        licenseExpiry: updates.licenseExpiry ? new Date(updates.licenseExpiry) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        hospital: updates.hospital,
        clinic: updates.clinic,
        address: updates.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'US',
        },
        contact: updates.contact || {
          phone: user.profile?.phone || '',
          email: user.email,
        },
        availability: updates.availability || {
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          hours: {
            start: '09:00',
            end: '17:00',
          },
          timezone: 'America/New_York',
        },
        consultationFee: updates.consultationFee || 100.00,
        languages: updates.languages || ['English'],
        bio: updates.bio,
        isVerified: false, // Will need admin verification
        isActive: true,
      });

      logger.info(`Doctor profile created for user: ${userId}`);
    } else {
      // Update existing profile
      await doctor.update(updates);
    }

    // Reload to get the updated record
    await doctor.reload();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { doctor: doctor.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};

// Get patients list - only patients who have appointments with this doctor
export const getPatients = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { search, page = 1, limit = 20 } = req.query;

    // Get doctor profile
    const doctor = await Doctor.findOne({ where: { userId } });
    if (!doctor) {
      res.json({
        success: true,
        data: {
          patients: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
          },
        },
      });
      return;
    }

    // Check if PostgreSQL is connected
    const { sequelize } = await import('../config/database');
    let patientIds: string[] = [];

    try {
      await sequelize.authenticate();

      // Get all appointments for this doctor to find patient IDs
      const appointments = await Appointment.findAll({
        where: { doctorId: doctor.id },
        attributes: ['patientId'],
        group: ['patientId'], // Get unique patient IDs
      });

      // Extract unique patient IDs
      const patientIdsSet = new Set<string>();
      appointments.forEach((apt: any) => {
        if (apt.patientId) {
          const idStr = String(apt.patientId).trim();
          if (idStr && idStr !== 'null' && idStr !== 'undefined') {
            patientIdsSet.add(idStr);
          }
        }
      });
      patientIds = Array.from(patientIdsSet);
    } catch (dbError) {
      // PostgreSQL not available - return empty result
      res.json({
        success: true,
        data: {
          patients: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
          },
        },
        message: 'Database not available. Please configure PostgreSQL.',
      });
      return;
    }

    // If no appointments, return empty list
    if (patientIds.length === 0) {
      res.json({
        success: true,
        data: {
          patients: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
          },
        },
      });
      return;
    }

    // Convert patient IDs to MongoDB ObjectIds and fetch patients
    const mongoose = await import('mongoose');
    const objectIds = patientIds
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    if (objectIds.length === 0) {
      res.json({
        success: true,
        data: {
          patients: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
          },
        },
      });
      return;
    }

    // Build query for patients who have appointments AND have consented
    const baseQuery: any = {
      _id: { $in: objectIds },
      $or: [
        { 'consentSettings.shareWithDoctors': true },
        { 'consentSettings.shareWithDoctors': { $exists: false } },
        { 'consentSettings': { $exists: false } },
      ],
    };

    // Get ALL patients first (for total count) - populate to enable search filtering
    const allPatients = await Patient.find(baseQuery)
      .populate('userId', 'profile email');

    // Filter by search if provided (before pagination)
    let filteredPatients = allPatients;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredPatients = allPatients.filter((patient: any) => {
        const profile = patient.userId?.profile;
        const name = `${profile?.firstName || ''} ${profile?.lastName || ''}`.toLowerCase().trim();
        const email = (patient.userId?.email || '').toLowerCase();
        return name.includes(searchLower) || email.includes(searchLower);
      });
    }

    // Get total count BEFORE applying pagination
    const total = filteredPatients.length;

    // Apply pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;
    const paginatedPatients = filteredPatients.slice(skip, skip + limitNum);

    res.json({
      success: true,
      data: {
        patients: paginatedPatients.map((p: any) => ({
          _id: p._id,
          userId: p.userId?._id,
          user: {
            email: p.userId?.email,
            profile: p.userId?.profile,
          },
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: total, // Return actual total count
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get patient full history
export const getPatientHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId } = req.params;
    const { type, startDate, endDate } = req.query;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    // Check consent
    if (!patient.consentSettings.shareWithDoctors) {
      throw new AppError('Patient has not consented to share data with doctors', 403);
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

    const ehrRecords = await EHR.find(query)
      .sort({ date: -1 })
      .populate('recordedBy', 'profile');

    // Get patient user info
    const patientUser = await User.findById(patient.userId);

    res.json({
      success: true,
      data: {
        patient: {
          id: patient._id,
          _id: patient._id,
          userId: patient.userId,
          user: patientUser ? {
            email: patientUser.email,
            profile: patientUser.profile,
          } : null,
          emergencyContacts: patient.emergencyContacts,
          insurance: patient.insurance,
        },
        history: ehrRecords,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create prescription
export const createPrescription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      patientId,
      medications, // Array of medications
      diagnosis,
      notes,
      followUpDate,
      generatePDF = true // Always generate PDF by default for doctor prescriptions
    } = req.body;

    if (!patientId || !medications || !Array.isArray(medications) || medications.length === 0) {
      throw new AppError('Patient ID and at least one medication are required', 400);
    }

    // Validate each medication
    for (const med of medications) {
      if (!med.name || !med.dosage || !med.frequency || !med.duration) {
        throw new AppError('Each medication must have name, dosage, frequency, and duration', 400);
      }
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    // Check consent
    if (!patient.consentSettings.shareWithDoctors) {
      throw new AppError('Patient has not consented', 403);
    }

    // Get patient user info
    const patientUser = await User.findById(patient.userId);
    if (!patientUser) {
      throw new AppError('Patient user not found', 404);
    }

    // Get doctor info
    const doctor = await Doctor.findOne({ where: { userId } });
    const doctorUser = await User.findById(userId);
    if (!doctorUser) {
      throw new AppError('Doctor user not found', 404);
    }

    // Create EHR record
    const ehr = await EHR.create({
      patientId: patient._id,
      type: 'prescription',
      date: new Date(),
      recordedBy: userId,
      data: {
        prescription: {
          medications,
          diagnosis,
          notes,
          followUpDate,
        },
      },
    });

    // Always generate PDF for doctor prescriptions (default is now true)
    let pdfUrl: string | undefined;
    if (generatePDF) {
      try {
        const { generatePrescriptionPDF } = await import('../utils/pdfGenerator');
        const { uploadToS3 } = await import('../middleware/upload.middleware');

        const pdfData = {
          patientName: `${patientUser.profile?.firstName || ''} ${patientUser.profile?.lastName || ''}`.trim() || patientUser.email,
          patientAge: patientUser.profile?.dateOfBirth
            ? `${new Date().getFullYear() - new Date(patientUser.profile.dateOfBirth).getFullYear()} years`
            : undefined,
          date: new Date().toLocaleDateString(),
          doctorName: `${doctorUser.profile?.firstName || ''} ${doctorUser.profile?.lastName || ''}`.trim() || doctorUser.email,
          doctorSpecialization: doctor?.specialization || 'General Medicine',
          doctorLicense: doctor?.licenseNumber,
          doctorContact: doctor?.contact?.phone || doctor?.contact?.email,
          medications: medications.map((m: any) => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            instructions: m.instructions,
          })),
          diagnosis,
          notes,
          followUpDate,
        };

        const pdfBuffer = await generatePrescriptionPDF(pdfData);

        // Create a file-like object for upload
        const pdfFile = {
          buffer: pdfBuffer,
          originalname: `prescription-${patient._id}-${Date.now()}.pdf`,
          mimetype: 'application/pdf',
        } as Express.Multer.File;

        pdfUrl = await uploadToS3(pdfFile, 'prescriptions');
        logger.info(`Prescription PDF generated and uploaded: ${pdfUrl}`);

        // Update EHR with PDF URL
        ehr.data = {
          ...ehr.data,
          prescription: {
            ...ehr.data.prescription,
            pdfUrl,
          },
          attachments: [
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
      } catch (pdfError: any) {
        logger.error('Failed to generate prescription PDF:', {
          error: pdfError.message,
          stack: pdfError.stack,
          patientId,
          doctorId: userId,
        });
        // Continue without PDF - prescription is still created, but log the error
      }
    } else {
      logger.warn(`Prescription created without PDF (generatePDF=false) for patient ${patientId} by doctor ${userId}`);
    }

    logger.info(`Prescription created by doctor ${userId} for patient ${patientId}${pdfUrl ? ' with PDF' : ''}`);

    // Notify pharmacy staff
    try {
      if (getIO()) {
        const pharmacyUsers = await User.find({ role: 'pharmacy' });
        const doctorName = `${doctorUser.profile?.firstName || ''} ${doctorUser.profile?.lastName || ''}`.trim() || doctorUser.email;
        const patientName = `${patientUser.profile?.firstName || ''} ${patientUser.profile?.lastName || ''}`.trim() || patientUser.email;
        const medicationNames = medications.map((m: any) => m.name);

        // Notify each pharmacy user
        for (const pharmacyUser of pharmacyUsers) {
          notifyPrescriptionCreated(
            getIO(),
            pharmacyUser._id.toString(),
            patientName,
            medicationNames,
            ehr._id.toString()
          ).catch(err => logger.error(`Failed to notify pharmacy user ${pharmacyUser._id}:`, err));
        }
        logger.info(`Notified ${pharmacyUsers.length} pharmacy users about new prescription`);
      }
    } catch (notifyError) {
      logger.error('Failed to send pharmacy notifications:', notifyError);
    }

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: {
        ehr,
        pdfUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create diagnosis
export const createDiagnosis = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { patientId, condition, icd10Code, severity, notes } = req.body;

    if (!patientId || !condition) {
      throw new AppError('Patient ID and condition are required', 400);
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    const ehr = await EHR.create({
      patientId: patient._id,
      type: 'diagnosis',
      date: new Date(),
      recordedBy: userId,
      data: {
        diagnosis: {
          condition,
          icd10Code,
          severity: severity || 'mild',
          notes,
        },
      },
    });

    logger.info(`Diagnosis created by doctor ${userId} for patient ${patientId}`);

    res.status(201).json({
      success: true,
      message: 'Diagnosis created successfully',
      data: { ehr },
    });
  } catch (error) {
    next(error);
  }
};

// Request lab test
export const requestLabTest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { patientId, tests, notes, urgency, labId } = req.body;

    if (!patientId) {
      throw new AppError('Patient ID is required', 400);
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    // Check consent
    if (!patient.consentSettings.shareWithDoctors) {
      throw new AppError('Patient has not consented', 403);
    }

    // Ensure tests is an array and filter out empty strings
    const validTests = Array.isArray(tests)
      ? tests.filter((t: any) => t && (typeof t === 'string' ? t.trim() !== '' : t.name || t.testName))
      : (tests ? [tests] : []);

    if (validTests.length === 0) {
      throw new AppError('At least one valid test is required', 400);
    }

    // Create lab test request as EHR record
    const ehr = await EHR.create({
      patientId: patient._id,
      type: 'lab-test-request',
      date: new Date(),
      recordedBy: userId,
      data: {
        labTestRequest: {
          tests: validTests,
          notes,
          urgency: urgency || 'routine',
          status: 'REQUESTED',
          requestedAt: new Date(),
          labId: labId || undefined,
        },
      },
      tags: ['lab-test-request', 'REQUESTED'],
    });

    logger.info(`Lab test requested by doctor ${userId} for patient ${patientId} with tests: ${JSON.stringify(validTests)}`);

    logger.info(`Lab test requested by doctor ${userId} for patient ${patientId}`);

    // Notify lab staff
    try {
      if (getIO()) {
        const doctorUser = await User.findById(userId);
        const doctorName = `${doctorUser?.profile?.firstName || ''} ${doctorUser?.profile?.lastName || ''}`.trim() || doctorUser?.email || 'Unknown Doctor';

        // Populate patient user to get name
        const patientWithUser = await Patient.findById(patientId).populate('userId');
        const pUser = patientWithUser?.userId as any;
        const patientName = pUser ? `${pUser.profile?.firstName || ''} ${pUser.profile?.lastName || ''}`.trim() || pUser.email : 'Patient';

        const testNames = validTests.map((t: any) => typeof t === 'string' ? t : t.name);

        let labUsers = [];
        if (labId) {
          // Notify specific lab
          const specificLab = await User.findById(labId);
          if (specificLab && specificLab.role === 'lab') {
            labUsers.push(specificLab);
          }
        } else {
          // Notify all labs
          labUsers = await User.find({ role: 'lab' });
        }

        // Notify each lab user
        for (const labUser of labUsers) {
          notifyTestOrdered(
            getIO(),
            labUser._id.toString(),
            doctorName,
            patientName,
            testNames,
            ehr._id.toString(),
            urgency
          ).catch(err => logger.error(`Failed to notify lab user ${labUser._id}:`, err));
        }
        logger.info(`Notified ${labUsers.length} lab users about new test request`);
      }
    } catch (notifyError) {
      logger.error('Failed to send lab notifications:', notifyError);
    }

    res.status(201).json({
      success: true,
      message: 'Lab test requested successfully',
      data: { ehr },
    });
  } catch (error) {
    next(error);
  }
};

// Get appointments
export const getAppointments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if PostgreSQL is connected (with timeout and cache)
    const { sequelize } = await import('../config/database');

    // Cache connection status to avoid repeated checks
    const connectionCheck = async () => {
      try {
        // Use Promise.race to timeout the connection check after 500ms
        await Promise.race([
          sequelize.authenticate(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 2000))
        ]);
        return true;
      } catch {
        return false;
      }
    };

    const isConnected = await connectionCheck();
    if (!isConnected) {
      // Silently return empty appointments if PostgreSQL is not available
      res.json({
        success: true,
        data: { appointments: [] },
      });
      return;
    }

    const userId = req.user!.id;
    const { date, status } = req.query;

    const doctor = await Doctor.findOne({ where: { userId } });
    if (!doctor) {
      // If doctor profile doesn't exist, return empty appointments
      // The frontend should prompt the doctor to create their profile
      res.json({
        success: true,
        data: { appointments: [] },
        message: 'Doctor profile not found. Please update your profile first.',
      });
      return;
    }

    const query: any = { doctorId: doctor.id };

    if (date) {
      query.date = date;
    }

    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.findAll({
      where: query,
      order: [['date', 'ASC'], ['time', 'ASC']],
    });

    // Batch fetch patient info to avoid N+1 queries
    // Extract unique patient IDs and filter out null/undefined values
    const patientIdsSet = new Set<string>();
    appointments.forEach((apt: any) => {
      if (apt.patientId) {
        // Ensure patientId is a string and trim whitespace
        const idStr = String(apt.patientId).trim();
        if (idStr) {
          patientIdsSet.add(idStr);
        }
      }
    });
    const patientIds = Array.from(patientIdsSet);

    logger.info(`Extracted ${patientIds.length} unique patient IDs from ${appointments.length} appointments: ${JSON.stringify(patientIds)}`);

    let patients: any[] = [];
    if (patientIds.length > 0) {
      try {
        // Convert string IDs to MongoDB ObjectIds
        const mongoose = await import('mongoose');
        const objectIds = patientIds
          .filter(id => id && mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));

        if (objectIds.length > 0) {
          patients = await Patient.find({
            _id: { $in: objectIds },
          }).populate('userId', 'profile email');
          logger.debug(`Found ${patients.length} patients for ${objectIds.length} valid patient IDs (from ${patientIds.length} total)`);
        } else {
          logger.warn(`No valid ObjectIds found in patientIds: ${patientIds}`);
        }
      } catch (error) {
        logger.error('Error fetching patients:', error);
        patients = [];
      }
    }

    // Create a map for quick lookup
    const patientMap = new Map();
    patients.forEach((patient: any) => {
      if (!patient || !patient._id) {
        logger.warn('Invalid patient data:', patient);
        return;
      }

      const patientUser = patient.userId;
      if (patientUser) {
        const firstName = patientUser.profile?.firstName || '';
        const lastName = patientUser.profile?.lastName || '';
        const patientName = `${firstName} ${lastName}`.trim() || patientUser.email || 'Patient';

        const patientIdStr = patient._id.toString();
        const patientData = {
          patientName,
          patient: {
            _id: patientIdStr,
            userId: patient.userId._id.toString(),
            user: {
              email: patientUser.email,
              profile: patientUser.profile,
            },
          },
        };

        // Store with the ObjectId string as key
        patientMap.set(patientIdStr, patientData);
        logger.info(`Mapped patient ${patientIdStr} to name: ${patientName}`);
      } else {
        logger.warn(`Patient ${patient._id.toString()} has no userId`);
      }
    });

    logger.info(`Patient lookup: Found ${patients.length} patients, Map size: ${patientMap.size}, Total appointments: ${appointments.length}`);
    if (patientIds.length > 0 && patients.length === 0) {
      logger.error(`CRITICAL: No patients found for patientIds: ${JSON.stringify(patientIds)}`);
    }
    if (patientMap.size > 0) {
      logger.info(`Patient map keys: ${Array.from(patientMap.keys()).join(', ')}`);
    }

    // Format appointments with patient info
    const formattedAppointments = appointments.map((apt: any) => {
      // Get patient data from map - ensure patientId is converted to string for lookup
      let patientIdStr = String(apt.patientId).trim();

      // Try to get patient data from map
      let patientData = patientMap.get(patientIdStr);

      // If not found, try without trimming (in case of whitespace issues)
      if (!patientData && patientIdStr !== String(apt.patientId)) {
        patientIdStr = String(apt.patientId);
        patientData = patientMap.get(patientIdStr);
      }

      // Log if patient not found for debugging
      if (!patientData && patientMap.size > 0) {
        logger.error(`Patient not found in map for appointment ${apt.id}: patientId="${patientIdStr}", Map has ${patientMap.size} entries with keys: [${Array.from(patientMap.keys()).slice(0, 5).join(', ')}...]`);
      } else if (!patientData) {
        logger.warn(`Patient not found and map is empty for appointment ${apt.id}: patientId="${patientIdStr}"`);
      }

      // Ensure we have patient name
      const patientName = patientData?.patientName || 'Patient';
      const patient = patientData?.patient || null;

      // Ensure date is returned as string in YYYY-MM-DD format
      let dateStr: string;
      if (apt.date instanceof Date) {
        dateStr = apt.date.toISOString().split('T')[0];
      } else if (typeof apt.date === 'string') {
        // Handle DATEONLY format from PostgreSQL (YYYY-MM-DD)
        dateStr = apt.date.split('T')[0].split(' ')[0];
      } else {
        dateStr = String(apt.date);
      }

      // Log appointment details for debugging
      if (!patientData) {
        logger.error(`Appointment ${apt.id} missing patient data: patientId=${patientIdStr}, mapHasKey=${patientMap.has(patientIdStr)}`);
      }

      return {
        id: apt.id,
        patientId: apt.patientId,
        date: dateStr, // Always return as YYYY-MM-DD string
        time: apt.time,
        type: apt.type,
        status: apt.status,
        duration: apt.duration,
        notes: apt.notes,
        meetingLink: apt.meetingLink,
        patientName: patientName, // Always include patientName
        patient: patient,
        feeStatus: apt.feeStatus,
        visitFee: apt.visitFee,
        vatAmount: apt.vatAmount,
        serviceCharge: apt.serviceCharge,
        totalAmount: Number(apt.visitFee || 0) + Number(apt.vatAmount || 0) + Number(apt.serviceCharge || 0),
        feeCurrency: apt.feeCurrency,
        paymentDeadline: apt.paymentDeadline,
      };
    });

    res.json({
      success: true,
      data: { appointments: formattedAppointments },
    });
  } catch (error) {
    next(error);
  }
};

// Create appointment
export const createAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { patientId, date, time, type, duration, notes } = req.body;

    if (!patientId || !date || !time) {
      throw new AppError('Patient ID, date, and time are required', 400);
    }

    const doctor = await Doctor.findOne({ where: { userId } });
    if (!doctor) {
      throw new AppError('Doctor profile not found', 404);
    }

    // Check if slot is available
    const existingAppointment = await Appointment.findOne({
      where: {
        doctorId: doctor.id,
        date,
        time,
        status: { [Op.in]: ['scheduled', 'confirmed'] },
      },
    });

    if (existingAppointment) {
      throw new AppError('Time slot is already booked', 409);
    }

    // Calculate fees
    const visitFee = doctor.consultationFee || 0;
    const vatAmount = Number((visitFee * 0.05).toFixed(2));
    const serviceCharge = Number((visitFee * 0.02).toFixed(2));

    const appointment = await Appointment.create({
      patientId,
      doctorId: doctor.id,
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
      paymentDeadline: new Date(Date.now() + 30 * 60 * 1000), // 30 mins
    });

    // Send notifications
    try {
      const patient = await Patient.findById(patientId);
      const patientUser = patient ? await User.findById(patient.userId) : null;
      const doctorUser = await User.findById(userId);

      if (patientUser && doctorUser) {
        const pName = `${patientUser.profile?.firstName || 'Patient'} ${patientUser.profile?.lastName || ''}`.trim();
        const dName = `${doctorUser.profile?.firstName || 'Doctor'} ${doctorUser.profile?.lastName || ''}`.trim();

        await notifyAppointmentBooked(
          getIO(),
          patientUser._id.toString(),
          userId,
          appointment.id,
          date,
          time,
          dName,
          pName
        );
      }
    } catch (notifError) {
      logger.error('Failed to send appointment notifications:', notifError);
    }

    logger.info(`Appointment created by doctor ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

// Update appointment
export const updateAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const updates = req.body;

    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    await appointment.update(updates);

    // Notify patient if status changed to cancelled or rescheduled
    if (getIO() && (updates.status || updates.date || updates.time)) {
      try {
        const patient = await Patient.findById(appointment.patientId);
        const patientUser = patient ? await User.findById(patient.userId) : null;
        const doctor = await Doctor.findByPk(appointment.doctorId);
        const doctorUser = doctor ? await User.findById(doctor.userId) : null;

        if (patientUser && doctorUser) {
          const pName = `${patientUser.profile?.firstName || 'Patient'} ${patientUser.profile?.lastName || ''}`.trim();
          const dName = `${doctorUser.profile?.firstName || 'Doctor'} ${doctorUser.profile?.lastName || ''}`.trim();

          if (updates.status === 'cancelled') {
            await notifyAppointmentCancelled(
              getIO(),
              patientUser._id.toString(),
              doctorUser._id.toString(),
              appointment.id,
              appointment.date instanceof Date ? appointment.date.toISOString().split('T')[0] : String(appointment.date),
              dName,
              pName,
              'doctor'
            );
          } else {
            // General update/reschedule
            const title = 'Appointment Updated';
            const message = `Your appointment with Dr. ${dName} has been updated to ${appointment.date} at ${appointment.time}`;
            // Reusing appointment_booked type for generic updates for now, or use 'appointment'
            const { createNotification, sendRealtimeNotification } = await import('../utils/notifications');
            const notification = await createNotification(
              patientUser._id.toString(),
              'appointment',
              title,
              message,
              { appointmentId: appointment.id }
            );
            sendRealtimeNotification(getIO(), patientUser._id.toString(), notification);
          }
        }
      } catch (notifError) {
        logger.error('Failed to send appointment update notification:', notifError);
      }
    }
    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
};


// Record visit fee for appointment
export const recordVisitFee = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { appointmentId } = req.params;
    const { visitFee, feeStatus, feeCurrency = 'BDT' } = req.body;

    if (!visitFee || visitFee <= 0) {
      throw new AppError('Visit fee must be a positive number', 400);
    }

    if (!['pending', 'paid', 'waived'].includes(feeStatus)) {
      throw new AppError('Fee status must be: pending, paid, or waived', 400);
    }

    // Check if PostgreSQL is connected
    const { sequelize } = await import('../config/database');
    try {
      await sequelize.authenticate();
    } catch (dbError) {
      throw new AppError('Database not available. Please configure PostgreSQL.', 503);
    }

    // Get doctor profile
    const doctor = await Doctor.findOne({ where: { userId } });
    if (!doctor) {
      throw new AppError('Doctor profile not found', 404);
    }

    // Find appointment
    const appointment = await Appointment.findByPk(Number(appointmentId));
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Verify appointment belongs to this doctor
    if (appointment.doctorId !== doctor.id) {
      throw new AppError('Unauthorized to modify this appointment', 403);
    }

    // Update appointment with fee details
    await appointment.update({
      visitFee,
      feeStatus,
      feeCurrency,
      feeRecordedAt: new Date(),
      feeRecordedBy: userId,
    });

    logger.info(`Visit fee recorded by doctor ${userId} for appointment ${appointmentId}: ${feeCurrency} ${visitFee} (${feeStatus})`);

    res.json({
      success: true,
      message: 'Visit fee recorded successfully',
      data: {
        appointment: appointment.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update existing prescription
export const updatePrescription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { ehrId } = req.params;
    const {
      medications,
      diagnosis,
      notes,
      followUpDate,
      regeneratePDF = true,
    } = req.body;

    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      throw new AppError('At least one medication is required', 400);
    }

    // Validate each medication
    for (const med of medications) {
      if (!med.name || !med.dosage || !med.frequency || !med.duration) {
        throw new AppError('Each medication must have name, dosage, frequency, and duration', 400);
      }
    }

    // Find EHR record
    const ehr = await EHR.findById(ehrId);
    if (!ehr) {
      throw new AppError('Prescription not found', 404);
    }

    // Verify it's a prescription type
    if (ehr.type !== 'prescription') {
      throw new AppError('This EHR record is not a prescription', 400);
    }

    // Verify doctor owns this prescription
    if (ehr.recordedBy?.toString() !== userId) {
      throw new AppError('Unauthorized to modify this prescription', 403);
    }

    // Get patient info for PDF
    const patient = await Patient.findById(ehr.patientId);
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    const patientUser = await User.findById(patient.userId);
    if (!patientUser) {
      throw new AppError('Patient user not found', 404);
    }

    // Update prescription data
    ehr.data = {
      ...ehr.data,
      prescription: {
        medications,
        diagnosis,
        notes,
        followUpDate,
      },
    };

    // Regenerate PDF if requested
    let pdfUrl: string | undefined;
    if (regeneratePDF) {
      try {
        const { generatePrescriptionPDF } = await import('../utils/pdfGenerator');
        const { uploadToS3 } = await import('../middleware/upload.middleware');

        const doctor = await Doctor.findOne({ where: { userId } });
        const doctorUser = await User.findById(userId);

        const pdfData = {
          patientName: `${patientUser.profile?.firstName || ''} ${patientUser.profile?.lastName || ''}`.trim() || patientUser.email,
          patientAge: patientUser.profile?.dateOfBirth
            ? `${new Date().getFullYear() - new Date(patientUser.profile.dateOfBirth).getFullYear()} years`
            : undefined,
          date: new Date().toLocaleDateString(),
          doctorName: `${doctorUser?.profile?.firstName || ''} ${doctorUser?.profile?.lastName || ''}`.trim() || doctorUser?.email || 'Doctor',
          doctorSpecialization: doctor?.specialization || 'General Medicine',
          doctorLicense: doctor?.licenseNumber,
          doctorContact: doctor?.contact?.phone || doctor?.contact?.email,
          medications: medications.map((m: any) => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            instructions: m.instructions,
          })),
          diagnosis,
          notes,
          followUpDate,
        };

        const pdfBuffer = await generatePrescriptionPDF(pdfData);
        const pdfFile = {
          buffer: pdfBuffer,
          originalname: `prescription-${patient._id}-${Date.now()}-updated.pdf`,
          mimetype: 'application/pdf',
        } as Express.Multer.File;

        pdfUrl = await uploadToS3(pdfFile, 'prescriptions');
        logger.info(`Prescription PDF regenerated: ${pdfUrl}`);

        // Update with new PDF URL
        if (ehr.data.prescription) {
          ehr.data.prescription.pdfUrl = pdfUrl;
        }
        ehr.data.attachments = ehr.data.attachments || [];
        ehr.data.attachments.push({
          type: 'pdf',
          url: pdfUrl,
          name: pdfFile.originalname,
          uploadedAt: new Date(),
        });
      } catch (pdfError: any) {
        logger.error('Failed to regenerate prescription PDF:', pdfError);
        // Continue without PDF regeneration
      }
    }

    await ehr.save();

    logger.info(`Prescription updated by doctor ${userId} for patient ${ehr.patientId}`);

    res.json({
      success: true,
      message: 'Prescription updated successfully',
      data: {
        ehr,
        pdfUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};
