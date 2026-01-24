import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import Patient from '../models/mongodb/Patient.model';
import EHR from '../models/mongodb/EHR.model';
import User from '../models/mongodb/User.model';
import TestPrice from '../models/mongodb/TestPrice.model';
import Payment from '../models/mongodb/Payment.model';
import LabRevenue from '../models/mongodb/LabRevenue.model';
import Notification from '../models/mongodb/Notification.model';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { getIO } from '../utils/socket';
import { createNotification, notifyLabPayment, notifyResultUploaded } from '../utils/notifications';
import RevenueTransaction from '../models/mongodb/RevenueTransaction.model';
import UnifiedPayment from '../models/mongodb/UnifiedPayment.model';

/**
 * Internal helper to sync revenue when a lab test is completed and paid
 */
const syncLabRevenue = async (requestId: string): Promise<boolean> => {
  try {
    const request = await EHR.findById(requestId);
    if (!request || request.type !== 'lab-test-request') return false;

    // Must be completed or report uploaded and not already processed for revenue
    const status = request.data?.labTestRequest?.status;
    if ((status !== 'completed' && status !== 'REPORT_UPLOADED') || request.data?.labTestRequest?.revenueAdded) {
      return false;
    }

    // Must have a completed payment
    const payment = await UnifiedPayment.findOne({
      serviceId: requestId,
      serviceType: 'lab',
      paymentStatus: 'paid'
    });

    if (!payment) {
      logger.info(`Revenue Sync: No paid unified payment found for request ${requestId}`);
      return false;
    }

    // Calculate revenue (excluding platform commission if logic exists, for now using totalAmount)
    // NOTE: The LabRevenue.updateRevenue expects a breakdown. 
    // We can construct it from the payment's itemBreakdown.
    const testBreakdown = payment.itemBreakdown.map((item: any) => ({
      testName: item.name,
      price: item.total
    }));

    // Update Lab Revenue Account (Aggregate by day)
    await (LabRevenue as any).updateRevenue(
      payment.providerId,
      payment.totalAmount,
      testBreakdown
    );

    // Create a Revenue Transaction record for auditing
    await RevenueTransaction.create({
      type: 'lab',
      amount: payment.totalAmount,
      patientUserId: payment.patientId,
      providerUserId: payment.providerId,
      serviceId: requestId,
      transactionId: payment.transactionId || `AUTO-${Date.now()}`,
      paymentMethod: payment.paymentMethod || 'online',
      status: 'completed',
      date: new Date(),
      metadata: {
        invoiceId: payment.invoiceId,
        labRequestId: requestId
      }
    });

    // Mark as processed
    if (request.data && (request.data as any).labTestRequest) {
      (request.data as any).labTestRequest.revenueAdded = true;
      request.markModified('data');
      await request.save();
    }

    logger.info(`Revenue Sync: Successfully recorded revenue for request ${requestId}`);
    return true;
  } catch (error: any) {
    logger.error(`Revenue Sync Error for request ${requestId}:`, error);
    return false;
  }
};

// Upload test results
export const uploadTestResults = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId, testName, results, date, requestId } = req.body; // Added requestId

    if (!patientId || !testName || !results) {
      throw new AppError('Patient ID, test name, and results are required', 400);
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    // Check consent
    if (!patient.consentSettings.shareWithLabs) {
      throw new AppError('Patient has not consented', 403);
    }

    const ehr = await EHR.create({
      patientId: patient._id,
      type: 'lab',
      date: date ? new Date(date) : new Date(),
      recordedBy: req.user!.id,
      data: {
        labResults: (Array.isArray(results) ? results : [results]).map((r: any) => ({
          ...r,
          unit: r.unit || 'units'
        })),
      },
    });

    // If it's linked to a request, update the request status
    if (requestId) {
      const request = await EHR.findById(requestId);
      if (request && request.type === 'lab-test-request') {
        if (!request.data) request.data = {} as any;
        if (!request.data.labTestRequest) request.data.labTestRequest = {} as any;

        const labTestRequest = request.data.labTestRequest;
        if (labTestRequest) {
          labTestRequest.status = 'completed';
          labTestRequest.completedAt = new Date();
          labTestRequest.resultId = ehr._id as any;
          if (!labTestRequest.labId) {
            labTestRequest.labId = req.user!.id as any;
          }
        }

        const currentTags = (request.tags || []) as string[];
        request.tags = currentTags.filter(tag => tag !== 'ASSIGNED' && tag !== 'REQUESTED');
        request.tags.push('completed');

        request.markModified('tags');
        await request.save();

        // Sync revenue if applicable
        await syncLabRevenue(requestId);

        if (logger) {
          logger.info(`Lab request ${requestId} marked as completed via uploadTestResults`);
        }
      }
    }

    // Emit real-time notification via Socket.io and create notification
    if (getIO() && requestId) {
      // Find the original request and populate patient to get userId
      const originalRequest = await EHR.findById(requestId).populate('patientId');
      const patientDoc = originalRequest?.patientId as any;
      const targetUserId = patientDoc?.userId || patientId;
      const testNames = originalRequest?.data?.labTestRequest?.tests?.join(', ') || testName;
      const labUser = await User.findById(req.user!.id);
      const labName = `${labUser?.profile?.firstName || ''} ${labUser?.profile?.lastName || ''}`.trim() || 'Laboratory';

      await notifyResultUploaded(
        getIO(),
        [targetUserId], // userIds array
        [testNames], // testNames array
        requestId,
        labName
      );

      logger.info(`Notification sent for user ${targetUserId} for request ${requestId}`);
    }

    res.status(201).json({
      success: true,
      message: 'Report uploaded and EHR record created successfully',
      data: { ehr },
    });
  } catch (error) {
    next(error);
  }
};

// Get test results
export const getTestResults = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId, testName } = req.query;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const query: any = { type: 'lab' };

    if (userRole === 'patient') {
      // Patients can ONLY see their own data
      const patient = await Patient.findOne({ userId });
      if (!patient) {
        throw new AppError('Patient profile not found', 404);
      }
      query.patientId = patient._id;
    } else if (userRole === 'lab') {
      query.recordedBy = userId;
    } else if (patientId) {
      query.patientId = patientId;
    } else {
      // If no patientId provided and not patient or lab, require filter
      throw new AppError('Patient ID is required for doctors/admins', 400);
    }

    // Verify consent/access if not admin
    if (userRole !== 'admin' && query.patientId) {
      const patient = await Patient.findById(query.patientId);
      if (!patient) throw new AppError('Patient not found', 404);

      if (userRole === 'doctor' && !patient.consentSettings?.shareWithDoctors) {
        throw new AppError('Access denied: Patient has not shared data with doctors', 403);
      }
      if (userRole === 'lab' && !patient.consentSettings?.shareWithLabs) {
        throw new AppError('Access denied: Patient has not shared data with labs', 403);
      }
    }

    if (testName) {
      query['data.labResults.testName'] = testName;
    }

    const results = await EHR.find(query)
      .sort({ date: -1 })
      .populate({
        path: 'patientId',
        model: 'Patient',
        populate: {
          path: 'userId',
          model: 'User',
          select: 'profile email',
        },
      });

    res.json({
      success: true,
      data: { results },
    });
  } catch (error) {
    next(error);
  }
};

// Get patient tests
export const getPatientTests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;
    let targetPatientId: string;

    // Security Check
    if (userRole === 'patient') {
      const myPatient = await Patient.findOne({ userId });
      if (!myPatient) {
        throw new AppError('Patient profile not found', 404);
      }
      // If the requested patientId is the same as the user's patient ID or their user ID
      if (patientId !== userId && patientId !== myPatient._id.toString()) {
        throw new AppError('Access denied', 403);
      }
      // Force use of the correct patient ID
      targetPatientId = myPatient._id.toString();
    } else {
      targetPatientId = patientId;
    }

    const patient = await Patient.findById(targetPatientId).populate('userId', 'profile email');
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    if (userRole !== 'admin') {
      if (userRole === 'doctor' && !patient.consentSettings?.shareWithDoctors) {
        throw new AppError('Access denied', 403);
      }
      if (userRole === 'lab' && !patient.consentSettings?.shareWithLabs) {
        throw new AppError('Access denied', 403);
      }
    }

    const tests = await EHR.find({
      patientId: patient._id,
      type: 'lab',
    }).sort({ date: -1 });

    res.json({
      success: true,
      data: { tests },
    });
  } catch (error) {
    next(error);
  }
};

// Get lab requests (general, can filter by status)
export const getLabRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const labUserId = req.user!.id;
    const { status } = req.query;

    const query: any = {
      type: 'lab-test-request',
      $or: [
        { 'data.labTestRequest.labId': labUserId },
        {
          'data.labTestRequest.labId': { $exists: false },
          'data.labTestRequest.status': 'REQUESTED'
        },
        {
          'data.labTestRequest.labId': null,
          'data.labTestRequest.status': 'REQUESTED'
        }
      ]
    };

    if (status && status !== 'all' && status !== 'pending_only') {
      query['data.labTestRequest.status'] = status;
    } else if (status === 'pending_only') {
      // Internal flag for getPendingRequests - only actionable items for the lab
      query['data.labTestRequest.status'] = { $in: ['PAID', 'SAMPLE_COLLECTED', 'IN_PROGRESS'] };
    }
    // If no status or status is 'all', it returns everything for that lab

    const requests = await EHR.find(query)
      .populate({
        path: 'patientId',
        select: 'userId',
      })
      .populate({
        path: 'recordedBy',
        select: 'email profile',
        model: 'User',
      })
      .sort({ date: -1 })
      .lean();

    // Populate patient user details and calculate prices
    const TestPrice = (await import('../models/mongodb/TestPrice.model')).default;

    const requestsWithDetails = await Promise.all(
      requests.map(async (reqItem: any) => {
        try {
          const result: any = { ...reqItem };

          // Handle patientId population
          if (reqItem.patientId) {
            if (reqItem.patientId.userId) {
              const patientUser = await User.findById(reqItem.patientId.userId).select('email profile').lean();
              result.patient = {
                ...reqItem.patientId,
                user: patientUser || null,
              };
            } else if (typeof reqItem.patientId === 'object') {
              result.patient = reqItem.patientId;
            } else {
              const patient = await Patient.findById(reqItem.patientId).select('userId').lean();
              if (patient?.userId) {
                const patientUser = await User.findById(patient.userId).select('email profile').lean();
                result.patient = {
                  ...patient,
                  user: patientUser || null,
                };
              } else {
                result.patient = patient || null;
              }
            }
          }

          // Calculate prices
          const labRequest = reqItem.data?.labTestRequest;
          if (labRequest?.tests?.length > 0) {
            try {
              const testItems = labRequest.tests.map((t: any) =>
                typeof t === 'string' ? t : (t.testCode || t.name || t.testName)
              ).filter(Boolean);

              if (testItems.length > 0) {
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

                const testNameConditions = testItems.map((name: string) => {
                  const normalizedName = name.replace(/\s*\(\s*/g, '\\s*\\(\\s*').replace(/\s*\)\s*/g, '\\s*\\)\\s*');
                  return {
                    testName: { $regex: normalizedName.replace(/[.*+?^${}|[\]\\]/g, '\\$&'), $options: 'i' }
                  };
                });

                const allCodesToSearch = [...new Set([...codesUpper, ...extractedCodes])];

                // Use the labUserId from the request context (the lab viewing the requests)
                const priceRecords = await TestPrice.find({
                  labId: labUserId,
                  active: true,
                  $or: [
                    { testCode: { $in: allCodesToSearch } },
                    ...testNameConditions
                  ]
                }).lean();

                const prices = priceRecords.map((p: any) => ({
                  testName: p.testName,
                  price: p.price
                }));
                const totalPrice = priceRecords.reduce((sum: number, p: any) => sum + (p.price || 0), 0);

                if (!result.data.labTestRequest) result.data.labTestRequest = {};
                result.data.labTestRequest.estimatedCost = totalPrice;
                result.data.labTestRequest.priceBreakdown = prices;
              }
            } catch (err) {
              console.error(`Error calculating price for request ${reqItem._id}:`, err);
            }
          }

          return result;
        } catch (itemError) {
          console.error('Error processing request item:', itemError);
          if (logger) {
            logger.error('Error processing request item:', itemError);
          }
          return {
            ...reqItem,
            patient: reqItem.patientId || null,
          };
        }
      })
    );

    res.json({
      success: true,
      data: { requests: requestsWithDetails || [] },
    });
  } catch (error: any) {
    console.error('Error in getPendingRequests:', error);
    logger?.error?.('Error in getPendingRequests:', error);
    // Return empty array instead of crashing
    try {
      res.status(200).json({
        success: true,
        data: { requests: [] },
      });
    } catch (responseError) {
      // If we can't send response, pass to error handler
      next(error);
    }
  }
};

// Submit test results for a request
export const submitTestResults = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { requestId, results, notes } = req.body;

    if (!requestId || !results || !Array.isArray(results) || results.length === 0) {
      throw new AppError('Request ID and results array are required', 400);
    }

    // Find the lab test request
    const request = await EHR.findById(requestId);
    if (!request || request.type !== 'lab-test-request') {
      throw new AppError('Lab test request not found', 404);
    }

    // Check if already completed
    if (request.data?.labTestRequest?.status === 'completed') {
      throw new AppError('Test results already submitted', 400);
    }

    // Get patient and lab user info for PDF
    const patient = await Patient.findById(request.patientId);
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    const patientUser = await User.findById(patient.userId);
    if (!patientUser) {
      throw new AppError('Patient user not found', 404);
    }

    const labUser = await User.findById(req.user!.id);
    if (!labUser) {
      throw new AppError('Lab user not found', 404);
    }

    // Get doctor info if request was created by a doctor
    let doctorUser = null;
    if (request.recordedBy) {
      doctorUser = await User.findById(request.recordedBy);
    }

    // Create lab results EHR record
    const labResult = await EHR.create({
      patientId: request.patientId,
      type: 'lab',
      date: new Date(),
      recordedBy: req.user!.id,
      data: {
        labResults: results.map((result: any) => ({
          testName: result.testName,
          value: result.value,
          unit: result.unit || 'units',
          normalRange: {
            min: result.normalRange?.min || 0,
            max: result.normalRange?.max || 100,
          },
          status: result.status || 'normal',
        })),
      },
      tags: ['lab-result', 'completed'],
    });

    // Generate PDF
    let pdfUrl: string | undefined;
    try {
      const { generateLabResultPDF } = await import('../utils/pdfGenerator');
      const { uploadToS3 } = await import('../middleware/upload.middleware');

      const pdfData = {
        patientName: `${patientUser.profile?.firstName || ''} ${patientUser.profile?.lastName || ''}`.trim() || patientUser.email,
        patientAge: patientUser.profile?.dateOfBirth
          ? `${new Date().getFullYear() - new Date(patientUser.profile.dateOfBirth).getFullYear()} years`
          : undefined,
        date: new Date().toLocaleDateString(),
        labName: `${labUser.profile?.firstName || ''} ${labUser.profile?.lastName || ''}`.trim() || labUser.email,
        labContact: labUser.email,
        testResults: results.map((result: any) => ({
          testName: result.testName,
          value: result.value,
          unit: result.unit,
          normalRange: {
            min: result.normalRange?.min || 0,
            max: result.normalRange?.max || 100,
          },
          status: result.status || 'normal',
        })),
        notes,
        requestedBy: doctorUser
          ? `Dr. ${doctorUser.profile?.firstName || ''} ${doctorUser.profile?.lastName || ''}`.trim() || doctorUser.email
          : undefined,
      };

      const pdfBuffer = await generateLabResultPDF(pdfData);

      const pdfFile = {
        buffer: pdfBuffer,
        originalname: `lab-result-${patient._id}-${labResult._id}-${Date.now()}.pdf`,
        mimetype: 'application/pdf',
        size: pdfBuffer.length,
      } as Express.Multer.File;

      pdfUrl = await uploadToS3(pdfFile, 'lab-results');

      // Update lab result with PDF URL
      try {
        // Use markModified to ensure Mongoose saves nested object changes
        if (!labResult.data) {
          labResult.data = {};
        }
        if (!labResult.data.attachments) {
          labResult.data.attachments = [];
        }
        labResult.data.attachments.push({
          type: 'pdf',
          url: pdfUrl,
          name: pdfFile.originalname,
          uploadedAt: new Date(),
        });
        labResult.markModified('data');
        await labResult.save();
        if (logger) {
          logger.info(`Lab result PDF generated and uploaded: ${pdfUrl}`);
        }
      } catch (saveError: any) {
        if (logger) {
          logger.error(`Failed to save lab result with PDF URL`, {
            error: saveError.message,
            pdfUrl,
          });
        }
        // Don't fail the request if save fails - PDF is already uploaded
      }

      if (logger) {
        logger.info(`Lab result PDF generated and uploaded: ${pdfUrl}`);
      }
    } catch (pdfError: any) {
      logger?.error('Failed to generate lab result PDF:', {
        error: pdfError.message,
        stack: pdfError.stack,
        labResultId: labResult._id,
      });
      // Don't fail the request if PDF generation fails
      logger?.warn(`Lab results submitted but PDF generation failed for ${labResult._id}`);
    }

    // Update the request status
    if (request.data && request.data.labTestRequest) {
      request.data.labTestRequest.status = 'completed';
      if (notes) {
        request.data.labTestRequest.notes = notes;
      }
      request.tags = (request.tags || []).filter((tag: string) => tag !== 'ASSIGNED' && tag !== 'REQUESTED');
      request.tags.push('completed');
      request.markModified('tags');
      await request.save();

      // Sync revenue if applicable
      await syncLabRevenue(requestId);
    }

    if (logger) {
      logger.info(`Lab test results submitted by ${req.user!.id} for request ${requestId}`);
    }

    res.status(201).json({
      success: true,
      message: 'Test results submitted successfully',
      data: { labResult, request, pdfUrl },
    });
  } catch (error) {
    next(error);
  }
};

// Create a new lab test request (by lab technician)
export const createTestRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId, tests, notes, urgency } = req.body;

    if (!patientId || !tests || (!Array.isArray(tests) || tests.length === 0)) {
      throw new AppError('Patient ID and at least one test are required', 400);
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    // Check consent
    if (!patient.consentSettings.shareWithLabs) {
      throw new AppError('Patient has not consented', 403);
    }

    // Create lab test request as EHR record
    const ehr = await EHR.create({
      patientId: patient._id,
      type: 'lab-test-request',
      date: new Date(),
      recordedBy: req.user!.id,
      data: {
        labTestRequest: {
          tests: Array.isArray(tests) ? tests : [{ name: tests }],
          notes,
          urgency: urgency || 'routine',
          status: 'ASSIGNED',
          labId: req.user!.id,
          requestedAt: new Date(),
          assignedAt: new Date(),
          assignedBy: req.user!.id,
        },
      },
      tags: ['lab-test-request', 'ASSIGNED'],
    });

    if (logger) {
      logger.info(`Lab test requested by lab technician ${req.user!.id} for patient ${patientId}`);
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

// Generate PDF for existing lab result
export const generateLabResultPDF = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ehrId } = req.params;

    if (logger) {
      logger.info(`[generateLabResultPDF] Starting PDF generation for lab`, { ehrId, userId: req.user!.id });
    }

    // Find the lab result EHR record
    const labResult = await EHR.findById(ehrId);
    if (!labResult || labResult.type !== 'lab') {
      if (logger) {
        logger.error(`[generateLabResultPDF] Lab result not found`, { ehrId });
      }
      throw new AppError('Lab result not found', 404);
    }

    // Check if PDF already exists
    const existingPdf = labResult.data?.attachments?.find((att: any) => att.type === 'pdf');
    if (existingPdf) {
      if (logger) {
        logger.info(`[generateLabResultPDF] PDF already exists, returning URL`, { pdfUrl: existingPdf.url });
      }
      res.json({
        success: true,
        message: 'PDF already exists',
        data: { pdfUrl: existingPdf.url },
      });
      return;
    }

    // Validate that lab results exist
    if (!labResult.data?.labResults || labResult.data.labResults.length === 0) {
      if (logger) {
        logger.error(`[generateLabResultPDF] No lab results found in EHR`, { ehrId });
      }
      throw new AppError('No lab test results found', 400);
    }

    // Get patient info
    const patient = await Patient.findById(labResult.patientId);
    if (!patient) {
      if (logger) {
        logger.error(`[generateLabResultPDF] Patient not found`, { patientId: labResult.patientId });
      }
      throw new AppError('Patient not found', 404);
    }

    const patientUser = await User.findById(patient.userId);
    if (!patientUser) {
      if (logger) {
        logger.error(`[generateLabResultPDF] Patient user not found`, { userId: patient.userId });
      }
      throw new AppError('Patient user not found', 404);
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

    // Generate PDF
    const { generateLabResultPDF: generatePDF } = await import('../utils/pdfGenerator');
    const { uploadToS3 } = await import('../middleware/upload.middleware');

    const pdfData = {
      patientName: `${patientUser.profile?.firstName || ''} ${patientUser.profile?.lastName || ''}`.trim() || patientUser.email,
      patientAge: patientUser.profile?.dateOfBirth
        ? `${new Date().getFullYear() - new Date(patientUser.profile.dateOfBirth).getFullYear()} years`
        : undefined,
      date: labResult.date ? new Date(labResult.date).toLocaleDateString() : new Date().toLocaleDateString(),
      labName: labUser
        ? `${labUser.profile?.firstName || ''} ${labUser.profile?.lastName || ''}`.trim() || labUser.email
        : 'Laboratory',
      labContact: labUser?.email,
      testResults: (labResult.data?.labResults || []).map((result: any) => ({
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
        patientName: pdfData.patientName
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
    } catch (s3Error: any) {
      if (logger) {
        logger.error(`[generateLabResultPDF] S3 upload failed`, {
          error: s3Error.message,
          stack: s3Error.stack,
        });
      }
      throw new AppError(`Failed to upload PDF: ${s3Error.message}`, 500);
    }

    // Update lab result with PDF URL
    try {
      // Use markModified to ensure Mongoose saves nested object changes
      if (!labResult.data) {
        labResult.data = {};
      }
      if (!labResult.data.attachments) {
        labResult.data.attachments = [];
      }
      labResult.data.attachments.push({
        type: 'pdf',
        url: pdfUrl,
        name: pdfFile.originalname,
        uploadedAt: new Date(),
      });
      labResult.markModified('data');
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
      logger.info(`[generateLabResultPDF] Lab result PDF generated and uploaded successfully`, { pdfUrl });
    }

    res.json({
      success: true,
      message: 'PDF generated successfully',
      data: { pdfUrl },
    });
  } catch (error: any) {
    if (logger) {
      logger.error(`[generateLabResultPDF] Error in PDF generation`, {
        error: error.message,
        stack: error.stack,
        ehrId: req.params.ehrId,
      });
    }
    next(error);
  }
};

// Get dashboard statistics
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const labUserId = req.user!.id.toString();

    // Get all lab test requests assigned to this lab - with error handling
    let allRequests: any[] = [];
    let allResults: any[] = [];

    try {
      allRequests = await EHR.find({
        type: 'lab-test-request',
        $or: [
          { 'data.labTestRequest.labId': labUserId },
          {
            'data.labTestRequest.labId': { $exists: false },
            'data.labTestRequest.status': 'REQUESTED'
          },
          {
            'data.labTestRequest.labId': null,
            'data.labTestRequest.status': 'REQUESTED'
          }
        ]
      }).lean();
    } catch (queryError) {
      console.error('Error fetching lab test requests:', queryError);
      if (logger) {
        logger.error('Error fetching lab test requests:', queryError);
      }
      allRequests = [];
    }

    try {
      allResults = await EHR.find({
        type: 'lab',
        recordedBy: labUserId
      }).lean();
    } catch (queryError) {
      console.error('Error fetching lab results:', queryError);
      if (logger) {
        logger.error('Error fetching lab results:', queryError);
      }
      allResults = [];
    }

    // Count by status - with defensive checks
    const assignedCount = allRequests.filter((r: any) => {
      try {
        const s = r?.data?.labTestRequest?.status;
        return (s === 'PAID' || s === 'SAMPLE_COLLECTED' || s === 'IN_PROGRESS');
      } catch (e) {
        return false;
      }
    }).length;

    const completedCount = allRequests.filter((r: any) => {
      try {
        return r?.data?.labTestRequest?.status === 'completed';
      } catch (e) {
        return false;
      }
    }).length;

    const criticalCount = allRequests.filter((r: any) => {
      try {
        return r?.data?.labTestRequest?.urgency === 'stat';
      } catch (e) {
        return false;
      }
    }).length;

    // Count today's requests
    const todayRequests = allRequests.filter((r: any) => {
      try {
        if (!r?.date) return false;
        const reqDate = new Date(r.date);
        return reqDate >= startOfToday;
      } catch (e) {
        return false;
      }
    }).length;

    // Count today's tests - with defensive date handling
    const todayResults = allResults.filter((r: any) => {
      try {
        if (!r?.date) return false;
        const resultDate = new Date(r.date);
        if (isNaN(resultDate.getTime())) return false;
        return resultDate >= startOfToday;
      } catch (e) {
        return false;
      }
    }).length;

    // Count this week's tests
    const weekResults = allResults.filter((r: any) => {
      try {
        if (!r?.date) return false;
        const resultDate = new Date(r.date);
        if (isNaN(resultDate.getTime())) return false;
        return resultDate >= startOfWeek;
      } catch (e) {
        return false;
      }
    }).length;

    // Count this month's tests
    const monthResults = allResults.filter((r: any) => {
      try {
        if (!r?.date) return false;
        const resultDate = new Date(r.date);
        if (isNaN(resultDate.getTime())) return false;
        return resultDate >= startOfMonth;
      } catch (e) {
        return false;
      }
    }).length;

    // Get test type statistics (from completed lab results)
    const testTypeStats: Record<string, number> = {};
    allResults.forEach((result: any) => {
      try {
        if (result?.data?.labResults && Array.isArray(result.data.labResults)) {
          result.data.labResults.forEach((labResult: any) => {
            if (labResult && typeof labResult === 'object') {
              const testName = labResult.testName || 'Unknown';
              testTypeStats[testName] = (testTypeStats[testName] || 0) + 1;
            }
          });
        }
      } catch (e) {
        // Skip invalid results
        if (logger) {
          logger.warn('Invalid lab result data structure:', e);
        } else {
          console.warn('Invalid lab result data structure:', e);
        }
      }
    });

    // Convert to array for chart
    const testTypeChart = Object.entries(testTypeStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10); // Top 10 tests

    // Get revenue data from LabRevenue model
    const revenueData = await LabRevenue.find({
      labId: labUserId,
      date: { $gte: startOfMonth }
    }).lean();

    const todayRevenue = revenueData
      .filter((r: any) => new Date(r.date).setHours(0, 0, 0, 0) === startOfToday.getTime())
      .reduce((sum: number, r: any) => sum + r.totalRevenue, 0);

    const monthRevenue = revenueData
      .reduce((sum: number, r: any) => sum + r.totalRevenue, 0);

    // Get completed paid tests count
    const completedPaidCount = await EHR.countDocuments({
      type: 'lab-test-request',
      'data.labTestRequest.labId': labUserId,
      'data.labTestRequest.status': { $in: ['completed', 'REPORT_UPLOADED'] },
      'data.labTestRequest.revenueAdded': true
    });

    res.json({
      success: true,
      data: {
        stats: {
          pendingRequests: assignedCount || 0,
          completedTests: completedCount || 0,
          todayTests: todayRequests || 0,
          weekTests: weekResults || 0,
          monthTests: monthResults || 0,
          criticalAlerts: criticalCount || 0,
          completedToday: todayResults || 0,
          todayRevenue: todayRevenue || 0,
          monthRevenue: monthRevenue || 0,
          completedPaidTests: completedPaidCount || 0,
          growthRate: 15, // Keep mock for now
        },
        testTypeChart: testTypeChart || [],
        revenueData: revenueData.map((r: any) => ({
          date: r.date,
          revenue: r.totalRevenue,
          tests: r.testCount
        }))
      },
    });
  } catch (error: any) {
    console.error('Error in getDashboardStats:', error);
    if (logger) {
      logger.error('Error in getDashboardStats:', error);
    }
    // Return empty data instead of crashing
    try {
      res.status(200).json({
        success: true,
        data: {
          stats: {
            pendingRequests: 0,
            completedTests: 0,
            todayTests: 0,
            weekTests: 0,
            monthTests: 0,
            criticalAlerts: 0,
            completedToday: 0,
          },
          testTypeChart: [],
        },
      });
    } catch (responseError) {
      // If we can't send response, pass to error handler
      next(error);
    }
  }
};

// Get all test prices for a lab
export const getTestPrices = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const labId = req.user!.id;

    const prices = await TestPrice.find({ labId, active: true })
      .sort({ testName: 1 })
      .lean();

    res.json({
      success: true,
      data: { prices },
    });
  } catch (error) {
    next(error);
  }
};

// Create or update test price
export const upsertTestPrice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const labId = req.user!.id;
    const { testCode, testName, price, description, active, preparationInstructions, estimatedDeliveryTime, sampleType } = req.body;
    const { priceId } = req.params;

    if (!testCode || !testName || price === undefined) {
      throw new AppError('Test code, name, and price are required', 400);
    }

    if (price < 0) {
      throw new AppError('Price must be non-negative', 400);
    }

    // If priceId is provided (PUT request), update by ID
    // Otherwise (POST request), find/update by testCode
    const query = priceId
      ? { _id: priceId, labId }
      : { labId, testCode: testCode.toUpperCase() };

    const priceData = await TestPrice.findOneAndUpdate(
      query,
      {
        labId,
        testCode: testCode.toUpperCase(),
        testName,
        price,
        description,
        preparationInstructions,
        estimatedDeliveryTime,
        sampleType,
        active: active !== undefined ? active : true,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Test price saved successfully',
      data: { price: priceData },
    });
  } catch (error) {
    next(error);
  }
};

// Delete test price
export const deleteTestPrice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const labId = req.user!.id;
    const { priceId } = req.params;

    await TestPrice.findOneAndDelete({ _id: priceId, labId });

    res.json({
      success: true,
      message: 'Test price deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get lab profile
export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const user = await User.findById(userId).select('_id email profile');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
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

// Update lab profile
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { profile, labDetails, ...updates } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Handle profile image upload
    if (req.file) {
      try {
        const { uploadToS3 } = await import('../middleware/upload.middleware');
        const imageUrl = await uploadToS3(req.file, 'lab-profiles');
        if (!user.profile) {
          user.profile = {
            firstName: '',
            lastName: '',
          } as any;
        }
        const profile = user.profile as any;
        profile.avatar = imageUrl;
        if (logger) {
          logger.info(`Profile image uploaded for lab ${userId}: ${imageUrl}`);
        }
      } catch (uploadError: any) {
        if (logger) {
          logger.error('Failed to upload profile image:', uploadError);
        }
        throw new AppError(uploadError.message || 'Failed to upload profile image', 500);
      }
    }

    // Update profile fields
    if (profile) {
      user.profile = {
        ...(user.profile || {}),
        ...profile,
      } as any;
    }

    // Update lab details
    if (labDetails) {
      user.labDetails = {
        ...(user.labDetails || {}),
        ...labDetails,
      } as any;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          profile: user.profile,
          labDetails: user.labDetails,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Upload a lab report file (PDF, CSV, Image)
export const uploadReportFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;

    console.log('--- [uploadReportFile] DEBUG START ---');
    console.log('Request Params ID:', requestId);
    console.log('Request Body:', req.body);
    console.log('Request File:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'MISSING');

    if (!requestId) {
      console.warn('[uploadReportFile] Missing requestId');
      throw new AppError('Request ID is required', 400);
    }

    if (!req.file) {
      console.warn('[uploadReportFile] Missing file');
      throw new AppError('No file provided', 400);
    }

    // Find the lab test request
    const request = await EHR.findById(requestId);
    if (!request || request.type !== 'lab-test-request') {
      throw new AppError('Lab test request not found', 404);
    }

    // Check if already completed
    if (request.data?.labTestRequest?.status === 'completed') {
      throw new AppError('Test results already submitted', 400);
    }

    // Upload file to S3
    const { uploadToS3 } = await import('../middleware/upload.middleware');
    const fileUrl = await uploadToS3(req.file, 'lab-reports');

    // Create lab results EHR record with the file attachment
    let attachmentType: 'pdf' | 'image' | 'csv' | 'excel' | 'document' | 'file' = 'file';
    const mime = req.file.mimetype.toLowerCase();
    if (mime.includes('pdf')) attachmentType = 'pdf';
    else if (mime.includes('image')) attachmentType = 'image';
    else if (mime.includes('csv')) attachmentType = 'csv';
    else if (mime.includes('excel') || mime.includes('spreadsheet') || mime.includes('sheet')) attachmentType = 'excel';
    else if (mime.includes('word') || mime.includes('officedocument')) attachmentType = 'document';

    const labResult = await EHR.create({
      patientId: request.patientId,
      type: 'lab',
      date: new Date(),
      recordedBy: req.user!.id,
      data: {
        labResults: [], // Empty since we are uploading a file instead of raw metrics
        attachments: [
          {
            type: attachmentType,
            url: fileUrl,
            name: req.file.originalname,
            uploadedAt: new Date(),
          },
        ],
      },
      tags: ['lab-result', 'completed', 'file-upload'],
    });

    // Update the request status
    if (request.data && request.data.labTestRequest) {
      request.data.labTestRequest.status = 'REPORT_UPLOADED';
      if (!request.data.labTestRequest.labId) {
        request.data.labTestRequest.labId = req.user!.id as any;
      }
      if (notes) {
        request.data.labTestRequest.notes = notes;
      }
      request.tags = (request.tags || []).filter((tag: string) => tag !== 'ASSIGNED' && tag !== 'REQUESTED' && tag !== 'PAID' && tag !== 'SAMPLE_COLLECTED' && tag !== 'IN_PROGRESS' && tag !== 'completed');
      request.tags.push('REPORT_UPLOADED');
      request.markModified('data');
      request.markModified('tags');
      await request.save();
    }

    if (logger) {
      logger.info(`Lab report file uploaded by ${req.user!.id} for request ${requestId}: ${fileUrl}`);
    }

    res.status(201).json({
      success: true,
      message: 'Report file uploaded successfully',
      data: { labResult, request, fileUrl },
    });

    // Emit real-time notification via Socket.io
    if (getIO()) {
      // Populate request to get patient.userId
      const fullRequest = await EHR.findById(requestId).populate('patientId');
      const patientDoc = fullRequest?.patientId as any;
      const targetUserId = patientDoc?.userId;

      if (targetUserId) {
        getIO().to(targetUserId.toString()).emit('lab-status-update', {
          requestId,
          status: 'completed',
          testName: fullRequest?.data?.labTestRequest?.tests?.join(', ') || 'Lab Test',
          message: 'Your lab results are now available.'
        });
        logger.info(`Socket.io event emitted for user ${targetUserId} (file upload)`);
      }
    }
  } catch (error) {
    next(error);
  }
};

// Get lab notifications
export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const labUserId = req.user!.id;

    // Get recent lab test requests assigned to this lab
    const recentRequests = await EHR.find({
      type: 'lab-test-request',
      'data.labTestRequest.labId': labUserId,
      'data.labTestRequest.status': { $in: ['ASSIGNED', 'IN_PROGRESS'] },
    })
      .sort({ date: -1 })
      .limit(10)
      .populate({
        path: 'patientId',
        select: 'userId',
      })
      .lean();

    // Build notifications from requests
    const notifications = await Promise.all(
      recentRequests.map(async (request: any) => {
        try {
          let patientName = 'Unknown Patient';

          if (request.patientId?.userId) {
            const patientUser = await User.findById(request.patientId.userId).select('profile').lean();
            if (patientUser?.profile) {
              patientName = `${patientUser.profile.firstName || ''} ${patientUser.profile.lastName || ''}`.trim();
            }
          }

          const tests = request.data?.labTestRequest?.tests || [];
          const testNames = Array.isArray(tests)
            ? tests.map((t: any) => typeof t === 'string' ? t : t.name || 'Test').join(', ')
            : 'Lab tests';

          return {
            id: request._id.toString(),
            title: 'New Lab Test Request',
            message: `${patientName} - ${testNames}`,
            type: 'test-request',
            read: false,
            createdAt: request.date || new Date(),
            urgency: request.data?.labTestRequest?.urgency || 'routine',
          };
        } catch (err) {
          logger?.error('Error processing notification:', err);
          return null;
        }
      })
    );

    // Filter out null values
    const validNotifications = notifications.filter((n): n is NonNullable<typeof n> => n !== null);

    res.json({
      success: true,
      data: { notifications: validNotifications },
    });
  } catch (error) {
    logger?.error('Error fetching notifications:', error);
    // Return empty array instead of error
    res.json({
      success: true,
      data: { notifications: [] },
    });
  }
};

// Aliases and specific wrappers
export const getPendingRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // If no status is provided, we force 'pending_only' behavior
  if (!req.query.status) {
    req.query.status = 'pending_only';
  }
  return getLabRequests(req, res, next);
};

// Search for patients (by name, email, or ID)
export const searchPatients = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q) {
      res.json({ success: true, data: { patients: [] } });
      return;
    }

    const searchStr = (q as string).trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(searchStr);

    let patients: any[] = [];

    if (isObjectId) {
      // Try finding directly by Patient ID
      const patient = await Patient.findById(searchStr).populate('userId', 'email profile').lean();
      if (patient) {
        patients = [patient];
      } else {
        // Try finding by User ID
        const patientByUser = await Patient.findOne({ userId: searchStr }).populate('userId', 'email profile').lean();
        if (patientByUser) patients = [patientByUser];
      }
    }

    if (patients.length === 0) {
      // Find users matching name or email
      const users = await User.find({
        $or: [
          { email: { $regex: searchStr, $options: 'i' } },
          { 'profile.firstName': { $regex: searchStr, $options: 'i' } },
          { 'profile.lastName': { $regex: searchStr, $options: 'i' } },
        ],
        role: 'patient',
      }).select('_id email profile').limit(20);

      const userIds = users.map(u => u._id);

      // Find patients for these users
      patients = await Patient.find({
        userId: { $in: userIds },
      }).populate('userId', 'email profile').lean();
    }

    // For each patient, get their test count
    const patientsWithCount = await Promise.all(
      patients.map(async (p: any) => {
        const count = await EHR.countDocuments({
          patientId: p._id,
          type: 'lab',
        });
        const lastTest = await EHR.findOne({
          patientId: p._id,
          type: 'lab',
        }).sort({ date: -1 }).select('date').lean();

        // Map userId to user for frontend consistency
        const { userId, ...rest } = p;
        return {
          ...rest,
          user: userId,
          testCount: count,
          lastTest: lastTest?.date,
        };
      })
    );

    res.json({
      success: true,
      data: { patients: patientsWithCount },
    });
  } catch (error) {
    next(error);
  }
};

// Process lab test payment
export const processLabPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { requestId, paymentMethod, transactionId } = req.body;
    const patientUserId = req.user!.id;

    if (!requestId || !paymentMethod) {
      throw new AppError('Request ID and payment method are required', 400);
    }

    // Find the lab test request
    const request = await EHR.findById(requestId).populate('patientId');
    if (!request || request.type !== 'lab-test-request') {
      throw new AppError('Lab test request not found', 404);
    }

    // Verify patient ownership
    const patient = await Patient.findById(request.patientId);
    if (!patient || patient.userId.toString() !== patientUserId) {
      throw new AppError('Access denied', 403);
    }

    // Check if already paid
    const existingPayment = await Payment.findOne({ labTestRequestId: requestId });
    if (existingPayment && existingPayment.status === 'completed') {
      throw new AppError('Payment already completed for this request', 400);
    }

    // Get lab ID from request
    const labId = request.data?.labTestRequest?.labId;
    if (!labId) {
      throw new AppError('Lab not assigned to this request', 400);
    }

    // Calculate pricing
    const tests = request.data?.labTestRequest?.tests || [];
    const testItems = tests.map((t: any) =>
      typeof t === 'string' ? t : (t.testCode || t.name || t.testName)
    ).filter(Boolean);

    if (testItems.length === 0) {
      throw new AppError('No tests found in request', 400);
    }

    // Fetch test prices
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

    const testNameConditions = testItems.map((name: string) => {
      const normalizedName = name.replace(/\s*\(\s*/g, '\\s*\\(\\s*').replace(/\s*\)\s*/g, '\\s*\\)\\s*');
      return {
        testName: { $regex: normalizedName.replace(/[.*+?^${}|[\]\\]/g, '\\$&'), $options: 'i' }
      };
    });

    const allCodesToSearch = [...new Set([...codesUpper, ...extractedCodes])];

    const priceRecords = await TestPrice.find({
      labId,
      active: true,
      $or: [
        { testCode: { $in: allCodesToSearch } },
        ...testNameConditions
      ]
    }).lean();

    if (priceRecords.length === 0) {
      throw new AppError('No pricing information found for requested tests', 404);
    }

    const testBreakdown = priceRecords.map((p: any) => ({
      testName: p.testName,
      testCode: p.testCode,
      price: p.price
    }));

    const totalAmount = priceRecords.reduce((sum: number, p: any) => sum + (p.price || 0), 0);

    // Generate transaction ID if not provided
    const finalTransactionId = transactionId || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create payment record
    const payment = await Payment.create({
      patientId: patient._id,
      labId,
      labTestRequestId: requestId,
      amount: totalAmount,
      currency: 'BDT',
      status: 'completed',
      paymentMethod,
      transactionId: finalTransactionId,
      testBreakdown,
      paymentDate: new Date(),
      metadata: {
        patientUserId,
        testCount: testBreakdown.length
      }
    });

    // Update lab test request status
    if (request.data && request.data.labTestRequest) {
      request.data.labTestRequest.status = 'PAID'; // Successfully paid
      request.data.labTestRequest.paymentId = payment._id as any;
      request.data.labTestRequest.paidAt = new Date() as any;

      const currentTags = (request.tags || []) as string[];
      request.tags = [
        ...currentTags.filter(tag => tag !== 'PENDING_PAYMENT'),
        'PAID'
      ];

      request.markModified('data');
      request.markModified('tags');
      await request.save();
    }

    // Update lab revenue
    const LabRevenueModel = LabRevenue as any;
    await LabRevenueModel.updateRevenue(labId, totalAmount, testBreakdown);

    // Get patient and lab info for notification
    const patientUser = await User.findById(patientUserId);
    const patientName = patientUser?.profile?.firstName && patientUser?.profile?.lastName
      ? `${patientUser.profile.firstName} ${patientUser.profile.lastName}`
      : patientUser?.email || 'Patient';

    const testNames = testBreakdown.map(t => t.testName);

    // Send notification to lab
    if (getIO()) {
      await notifyLabPayment(
        getIO(),
        labId,
        patientName,
        totalAmount,
        testNames,
        requestId
      );
    }

    // Record Revenue Transaction
    try {
      await RevenueTransaction.create({
        type: 'lab',
        amount: totalAmount,
        currency: 'BDT',
        patientUserId: patientUserId,
        providerUserId: labId,
        serviceId: requestId,
        transactionId: finalTransactionId,
        paymentMethod: paymentMethod,
        status: 'completed',
        date: new Date(),
        metadata: {
          testCount: testBreakdown.length,
          tests: testNames
        }
      });
    } catch (revError) {
      logger.error('Failed to record lab revenue transaction:', revError);
    }

    logger.info(`Payment processed: ${finalTransactionId} - Amount: ${totalAmount} BDT`);

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        payment,
        transactionId: finalTransactionId,
        amount: totalAmount,
        currency: 'BDT',
        testBreakdown
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get lab revenue statistics
export const getLabRevenue = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const labUserId = req.user!.id;
    const { period = 'daily', startDate, endDate } = req.query;

    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);
    end.setHours(23, 59, 59, 999);

    // Calculate date range based on period
    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else {
      switch (period) {
        case 'daily':
          start = new Date(now);
          start.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          start = new Date(now);
          start.setDate(now.getDate() - 7);
          start.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          start.setHours(0, 0, 0, 0);
          break;
        default:
          start = new Date(now);
          start.setHours(0, 0, 0, 0);
      }
    }

    // Get revenue records
    const revenueRecords = await LabRevenue.find({
      labId: labUserId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 }).lean();

    // Calculate totals
    const totalRevenue = revenueRecords.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
    const totalTests = revenueRecords.reduce((sum, r) => sum + (r.testCount || 0), 0);
    const totalPayments = revenueRecords.reduce((sum, r) => sum + (r.paymentCount || 0), 0);

    // Get revenue by test type
    const revenueByTest = new Map<string, number>();
    revenueRecords.forEach(record => {
      if (record.revenueByTest) {
        record.revenueByTest.forEach((value: number, key: string) => {
          revenueByTest.set(key, (revenueByTest.get(key) || 0) + value);
        });
      }
    });

    const revenueBreakdown = Array.from(revenueByTest.entries())
      .map(([testName, revenue]) => ({ testName, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    // Format chart data
    const chartData = revenueRecords.map(r => ({
      date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: r.totalRevenue,
      tests: r.testCount,
      payments: r.paymentCount
    }));

    res.json({
      success: true,
      data: {
        period,
        startDate: start,
        endDate: end,
        summary: {
          totalRevenue,
          totalTests,
          totalPayments,
          averagePerTest: totalTests > 0 ? totalRevenue / totalTests : 0
        },
        revenueBreakdown,
        chartData
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get detailed revenue analytics
export const getRevenueAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const labUserId = req.user!.id;
    const { startDate, endDate, limit = 50, skip = 0 } = req.query;

    const query: any = { providerUserId: labUserId, type: 'lab' };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const transactions = await RevenueTransaction.find(query)
      .sort({ date: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();

    const totalCount = await RevenueTransaction.countDocuments(query);

    // Aggregate monthly revenue for chart
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await LabRevenue.aggregate([
      { $match: { labId: new mongoose.Types.ObjectId(labUserId), date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: "$date" }, year: { $year: "$date" } },
          revenue: { $sum: "$totalRevenue" },
          tests: { $sum: "$testCount" },
          date: { $first: "$date" }
        }
      },
      { $sort: { "date": 1 } }
    ]);

    // Get today's revenue
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayRevenueDoc = await LabRevenue.findOne({
      labId: labUserId,
      date: today
    }).lean();

    // Get this week's revenue
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const weekRevenueDocs = await LabRevenue.find({
      labId: labUserId,
      date: { $gte: startOfWeek }
    }).lean();

    // Get this month's revenue
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthRevenueDocs = await LabRevenue.find({
      labId: labUserId,
      date: { $gte: startOfMonth }
    }).lean();

    // Get total revenue (all time)
    const allRevenueDocs = await LabRevenue.find({
      labId: labUserId
    }).lean();

    // Calculate daily trend (last 30 days)
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const dailyTrendDocs = await LabRevenue.find({
      labId: labUserId,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 }).lean();

    const dailyTrend = dailyTrendDocs.map(r => ({
      date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: r.totalRevenue,
      tests: r.testCount
    }));

    // Top revenue-generating tests
    const testRevenueMap = new Map<string, number>();
    const testCountMap = new Map<string, number>();
    allRevenueDocs.forEach(record => {
      if (record.revenueByTest) {
        record.revenueByTest.forEach((value: number, key: string) => {
          testRevenueMap.set(key, (testRevenueMap.get(key) || 0) + value);
          testCountMap.set(key, (testCountMap.get(key) || 0) + 1); // Simple count per day record
        });
      }
    });

    const topTests = Array.from(testRevenueMap.entries())
      .map(([testName, revenue]) => ({
        testName,
        revenue,
        count: testCountMap.get(testName) || 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Get yearly revenue
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const yearlyRevenueDocs = await LabRevenue.find({
      labId: labUserId,
      date: { $gte: startOfYear }
    }).lean();

    res.json({
      success: true,
      data: {
        today: {
          revenue: (todayRevenueDoc as any)?.totalRevenue || 0,
          tests: (todayRevenueDoc as any)?.testCount || 0,
          payments: (todayRevenueDoc as any)?.paymentCount || 0
        },
        week: {
          revenue: weekRevenueDocs.reduce((sum, r) => sum + (r.totalRevenue || 0), 0),
          tests: weekRevenueDocs.reduce((sum, r) => sum + (r.testCount || 0), 0),
          payments: weekRevenueDocs.reduce((sum, r) => sum + (r.paymentCount || 0), 0)
        },
        month: {
          revenue: monthRevenueDocs.reduce((sum, r) => sum + (r.totalRevenue || 0), 0),
          tests: monthRevenueDocs.reduce((sum, r) => sum + (r.testCount || 0), 0),
          payments: monthRevenueDocs.reduce((sum, r) => sum + (r.paymentCount || 0), 0)
        },
        year: {
          revenue: yearlyRevenueDocs.reduce((sum, r) => sum + (r.totalRevenue || 0), 0),
          tests: yearlyRevenueDocs.reduce((sum, r) => sum + (r.testCount || 0), 0),
          payments: yearlyRevenueDocs.reduce((sum, r) => sum + (r.paymentCount || 0), 0)
        },
        total: {
          revenue: allRevenueDocs.reduce((sum, r) => sum + (r.totalRevenue || 0), 0),
          tests: allRevenueDocs.reduce((sum, r) => sum + (r.testCount || 0), 0),
          payments: allRevenueDocs.reduce((sum, r) => sum + (r.paymentCount || 0), 0)
        },
        dailyTrend,
        topTests,
        transactions,
        pagination: {
          total: totalCount,
          limit: Number(limit),
          skip: Number(skip)
        },
        monthlyStats
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get notifications for lab user
export const getLabNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { unreadOnly = 'false', limit = '50' } = req.query;

    const query: any = { userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .lean();

    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      },
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
export const markNotificationAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await Notification.findOne({ _id: id, userId });
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

// Delete notification
export const deleteNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
};

// Get tests for the current lab
export const getMyTests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const labId = req.user!.id;
    const { page = 1, limit = 50 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const tests = await TestPrice.find({ labId })
      .sort({ testName: 1 })
      .skip(offset)
      .limit(Number(limit))
      .lean();

    const total = await TestPrice.countDocuments({ labId });

    res.json({
      success: true,
      data: {
        tests,
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

// Add or update a test price
export const updateTestPrice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const labId = req.user!.id;
    const { testCode, testName, price, description, active = true } = req.body;

    if (!testCode || !testName || price === undefined) {
      throw new AppError('Test code, name, and price are required', 400);
    }

    const testPrice = await TestPrice.findOneAndUpdate(
      { labId, testCode: testCode.toUpperCase() },
      {
        testName,
        price,
        description,
        active,
        lastUpdated: new Date()
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Test price updated successfully',
      data: { testPrice },
    });
  } catch (error) {
    next(error);
  }
};

// Update lab test request status (Collect Sample, Start Test, Complete Test)
export const updateLabRequestStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { requestId } = req.params;
    const { status, notes } = req.body;
    const labUserId = req.user!.id;

    const validStatuses = ['SAMPLE_COLLECTED', 'IN_PROGRESS', 'completed', 'REPORT_UPLOADED', 'FAILED'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status transition', 400);
    }

    const request = await EHR.findById(requestId);
    if (!request || request.type !== 'lab-test-request') {
      throw new AppError('Lab test request not found', 404);
    }

    // Verify lab ownership
    if (request.data?.labTestRequest?.labId?.toString() !== labUserId.toString()) {
      throw new AppError('Access denied: You are not assigned to this request', 403);
    }

    if (request.data && request.data.labTestRequest) {
      request.data.labTestRequest.status = status as any;
      if (notes) {
        request.data.labTestRequest.notes = notes;
      }

      // Update tags
      const currentTags = (request.tags || []) as string[];
      const tagsToRemove = ['REQUESTED', 'ASSIGNED', 'PAID', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'completed', 'REPORT_UPLOADED'];
      request.tags = [
        ...currentTags.filter(tag => !tagsToRemove.includes(tag)),
        status
      ];

      if (status === 'completed') {
        request.data.labTestRequest.completedAt = new Date();
      }

      request.markModified('tags');
      await request.save();

      if (status === 'completed' || status === 'REPORT_UPLOADED') {
        await syncLabRevenue(requestId);
      }
    }

    // Notify patient
    if (getIO()) {
      const fullRequest = await request.populate('patientId');
      const patientDoc = fullRequest?.patientId as any;
      const targetUserId = patientDoc?.userId;

      if (targetUserId) {
        const labUser = await User.findById(labUserId).select('profile email').lean();
        const labName = (labUser as any)?.profile?.firstName
          ? `${(labUser as any).profile.firstName} ${(labUser as any).profile.lastName || ''}`.trim()
          : 'The Laboratory';

        const notifType = status === 'REPORT_UPLOADED' ? 'result_uploaded' : 'test_completed';
        const title = status === 'REPORT_UPLOADED' ? 'Lab Results Available' : 'Lab Test Update';
        const message = `${labName} has updated your lab test status to: ${status.replace('_', ' ')}`;

        // Create persistent notification
        const notification = await createNotification(
          targetUserId,
          notifType,
          title,
          message,
          { requestId: requestId, status, labName }
        );

        // Send real-time notification
        getIO().to(targetUserId.toString()).emit('notification', {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          data: notification.data,
          createdAt: notification.createdAt,
          read: false
        });

        logger.info(`Patient ${targetUserId} notified about lab status update: ${status}`);
      }
    }

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      data: { request }
    });
  } catch (error) {
    next(error);
  }
};

// Get available labs for tests in a request
export const getAvailableLabsForTests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { requestId } = req.params;
    const request = await EHR.findById(requestId);

    if (!request || request.type !== 'lab-test-request') {
      throw new AppError('Lab test request not found', 404);
    }

    const requestedTests = (request.data as any)?.labTestRequest?.tests || [];
    const testNames = requestedTests.map((t: any) => typeof t === 'string' ? t : (t.name || t.testName));

    if (testNames.length === 0) {
      throw new AppError('No tests found in request', 400);
    }

    // Find all labs that offer AT LEAST ONE of these tests
    const testNameConditions = testNames.map((name: string) => ({
      testName: { $regex: name.replace(/[.*+?^${}|[\]\\]/g, '\\$&'), $options: 'i' }
    }));

    const priceRecords = await TestPrice.find({
      active: true,
      $or: testNameConditions
    }).lean();

    // Group by labId
    const labMap = new Map<string, any>();
    for (const record of priceRecords) {
      const labId = (record as any).labId.toString();
      if (!labMap.has(labId)) {
        labMap.set(labId, {
          labId,
          tests: [],
          totalPrice: 0,
          matchCount: 0
        });
      }
      const data = labMap.get(labId);
      data.tests.push({
        testName: (record as any).testName,
        price: (record as any).price,
        estimatedDeliveryTime: (record as any).estimatedDeliveryTime
      });
      data.totalPrice += (record as any).price;
      data.matchCount += 1;
    }

    // Return all matched labs
    const availableLabs = [];
    for (const [labId, data] of labMap) {
      const labUser = await User.findById(labId).select('profile labDetails email').lean();
      if (labUser) {
        availableLabs.push({
          ...data,
          labName: (labUser as any).profile?.firstName
            ? `${(labUser as any).profile.firstName} ${(labUser as any).profile.lastName || ''}`.trim()
            : (labUser as any).email.split('@')[0],
          labDetails: (labUser as any).labDetails,
          isFullMatch: data.matchCount === testNames.length
        });
      }
    }

    res.json({
      success: true,
      data: { availableLabs },
    });
  } catch (error) {
    next(error);
  }
};

// Assign a selected lab to a request
export const assignLabToRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { requestId } = req.params;
    const { labId } = req.body;
    const patientUserId = req.user!.id;

    if (!labId) {
      throw new AppError('Lab ID is required', 400);
    }

    const request = await EHR.findById(requestId).populate('patientId');
    if (!request || request.type !== 'lab-test-request') {
      throw new AppError('Lab test request not found', 404);
    }

    // Verify ownership
    const patient = await Patient.findById(request.patientId);
    if (!patient || patient.userId.toString() !== patientUserId) {
      throw new AppError('Access denied', 403);
    }

    // Update request with assigned lab
    if (request.data && (request.data as any).labTestRequest) {
      (request.data as any).labTestRequest.labId = new mongoose.Types.ObjectId(labId);
      (request.data as any).labTestRequest.assignedAt = new Date();
      (request.data as any).labTestRequest.assignedBy = new mongoose.Types.ObjectId(patientUserId);
      (request.data as any).labTestRequest.status = 'Payment Pending';

      request.markModified('data');
      await request.save();
    }

    res.json({
      success: true,
      message: 'Lab assigned successfully. You can now proceed to payment.',
      data: { request },
    });
  } catch (error) {
    next(error);
  }
};



