import { Response } from 'express';
import UnifiedPayment from '../models/mongodb/UnifiedPayment.model';
import EHR from '../models/mongodb/EHR.model';
import Appointment from '../models/postgres/Appointment.model';
import RevenueTransaction from '../models/mongodb/RevenueTransaction.model';
import Patient from '../models/mongodb/Patient.model';
import User from '../models/mongodb/User.model';
import { createNotification, sendRealtimeNotification } from '../utils/notifications';
import { getIO } from '../utils/socket';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';

/**
 * Initialize a payment for any service (Doctor/Lab/Pharmacy)
 * POST /api/payments/initiate
 */
export const initiatePayment = async (req: AuthRequest, res: Response) => {
    try {
        const { serviceType, serviceId, itemBreakdown } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const patient = await Patient.findOne({ userId });
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }

        const patientId = patient._id;

        if (!['doctor', 'lab', 'pharmacy'].includes(serviceType)) {
            return res.status(400).json({ success: false, message: 'Invalid service type' });
        }

        // Calculate amounts
        const baseAmount = itemBreakdown.reduce((sum: number, item: any) => sum + item.total, 0);
        const vatAmount = Math.round(baseAmount * 0.05); // 5% VAT
        const serviceCharge = Math.round(baseAmount * 0.02); // 2% service charge
        const totalAmount = baseAmount + vatAmount + serviceCharge;

        // Get provider ID based on service type
        let providerId = null;
        let metadata: any = {};

        if (serviceType === 'doctor') {
            const appointment = await Appointment.findByPk(serviceId);
            if (!appointment) {
                return res.status(404).json({ success: false, message: 'Appointment not found' });
            }
            providerId = appointment.doctorId.toString();
            metadata.doctorName = req.body.doctorName;
            metadata.appointmentDate = appointment.date;
        } else if (serviceType === 'lab') {
            const labRequest = await EHR.findById(serviceId);
            if (!labRequest) {
                return res.status(404).json({ success: false, message: 'Lab request not found' });
            }
            providerId = labRequest.data?.labTestRequest?.labId;
            metadata.labName = req.body.labName;
            metadata.testNames = itemBreakdown.map((item: any) => item.name);
        } else if (serviceType === 'pharmacy') {
            // TODO: Implement pharmacy order lookup
            metadata.pharmacyName = req.body.pharmacyName;
            metadata.orderItems = itemBreakdown;
        }

        // Set expiry (30 minutes from now)
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        // Create payment record
        const payment = await UnifiedPayment.create({
            serviceType,
            serviceId,
            patientId,
            providerId,
            baseAmount,
            vatAmount,
            serviceCharge,
            totalAmount,
            itemBreakdown,
            expiresAt,
            metadata,
        });

        return res.status(201).json({
            success: true,
            message: 'Payment initialized successfully',
            data: {
                payment: {
                    invoiceId: payment.invoiceId,
                    serviceType: payment.serviceType,
                    totalAmount: payment.totalAmount,
                    baseAmount: payment.baseAmount,
                    vatAmount: payment.vatAmount,
                    serviceCharge: payment.serviceCharge,
                    itemBreakdown: payment.itemBreakdown,
                    expiresAt: payment.expiresAt,
                    paymentStatus: payment.paymentStatus,
                },
            },
        });
    } catch (error: any) {
        console.error('Error initiating payment:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to initiate payment' });
    }
};

/**
 * Complete a payment
 * POST /api/payments/complete
 */
export const completePayment = async (req: AuthRequest, res: Response) => {
    try {
        const { invoiceId, paymentMethod, transactionId, gatewayResponse } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const patient = await Patient.findOne({ userId });
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }

        const patientId = patient._id;

        // Find payment
        const payment = await UnifiedPayment.findOne({ invoiceId, patientId });
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // Check if already paid
        if (payment.paymentStatus === 'paid') {
            return res.status(400).json({ success: false, message: 'Payment already completed' });
        }

        // Check if expired
        if (new Date() > payment.expiresAt) {
            payment.paymentStatus = 'expired';
            await payment.save();
            return res.status(400).json({ success: false, message: 'Payment has expired' });
        }

        // Update payment
        payment.paymentMethod = paymentMethod;
        payment.transactionId = transactionId;
        payment.gatewayResponse = gatewayResponse;
        payment.paymentStatus = 'paid';
        payment.paidAt = new Date();
        await payment.save();

        // Update service status based on type
        if (payment.serviceType === 'doctor') {
            const appointment = await Appointment.findByPk(payment.serviceId.toString());
            if (appointment) {
                appointment.feeStatus = 'paid';
                appointment.status = 'confirmed';
                await appointment.save();
            }
        } else if (payment.serviceType === 'lab') {
            const labRequest = await EHR.findById(payment.serviceId);
            if (labRequest && labRequest.data?.labTestRequest) {
                labRequest.data.labTestRequest.status = 'PAID';
                labRequest.markModified('data');
                await labRequest.save();
            }
        } else if (payment.serviceType === 'pharmacy') {
            // TODO: Update pharmacy order status
        }

        // Create revenue transaction
        await RevenueTransaction.create({
            type: payment.serviceType,
            amount: payment.totalAmount,
            patientUserId: patientId,
            providerUserId: payment.providerId,
            serviceId: payment.serviceId.toString(),
            transactionId: payment.transactionId,
            paymentMethod: payment.paymentMethod,
            status: 'completed',
            date: payment.paidAt,
            metadata: {
                invoiceId: payment.invoiceId,
            },
        });

        // Send notification to patient
        try {
            const title = 'Payment Successful';
            const message = `Your payment of ৳${payment.totalAmount} has been confirmed. Invoice: ${payment.invoiceId}`;
            const notification = await createNotification(
                userId,
                'payment_received',
                title,
                message,
                { invoiceId: payment.invoiceId, serviceType: payment.serviceType }
            );
            sendRealtimeNotification(getIO(), userId, notification);
        } catch (notifError) {
            console.error('Failed to send payment notification:', notifError);
        }

        return res.status(200).json({
            success: true,
            message: 'Payment completed successfully',
            data: {
                payment: {
                    invoiceId: payment.invoiceId,
                    serviceType: payment.serviceType,
                    totalAmount: payment.totalAmount,
                    paymentMethod: payment.paymentMethod,
                    paymentStatus: payment.paymentStatus,
                    paidAt: payment.paidAt,
                },
            },
        });
    } catch (error: any) {
        console.error('Error completing payment:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to complete payment' });
    }
};

/**
 * Get all pending payments for a patient
 * GET /api/payments/pending
 */
export const getPendingPayments = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const patient = await Patient.findOne({ userId });
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }

        const patientId = patient._id;

        const payments = await UnifiedPayment.find({
            patientId,
            paymentStatus: 'pending',
            expiresAt: { $gt: new Date() }, // Not expired
        }).sort({ createdAt: -1 });

        // Enrich with service details
        const enrichedPayments = await Promise.all(
            payments.map(async (payment) => {
                let serviceDetails: any = {};

                if (payment.serviceType === 'doctor') {
                    const appointment = await Appointment.findByPk(payment.serviceId.toString());
                    if (appointment) {
                        serviceDetails = {
                            appointmentDate: appointment.date,
                            appointmentTime: appointment.time,
                            doctorName: payment.metadata?.doctorName || 'Doctor',
                        };
                    }
                } else if (payment.serviceType === 'lab') {
                    serviceDetails = {
                        labName: payment.metadata?.labName || 'Laboratory',
                        testNames: payment.metadata?.testNames || [],
                    };
                } else if (payment.serviceType === 'pharmacy') {
                    serviceDetails = {
                        pharmacyName: payment.metadata?.pharmacyName || 'Pharmacy',
                        itemCount: payment.itemBreakdown.length,
                    };
                }

                return {
                    invoiceId: payment.invoiceId,
                    serviceType: payment.serviceType,
                    totalAmount: payment.totalAmount,
                    itemBreakdown: payment.itemBreakdown,
                    expiresAt: payment.expiresAt,
                    createdAt: payment.createdAt,
                    serviceDetails,
                };
            })
        );

        return res.status(200).json({
            success: true,
            data: { payments: enrichedPayments },
        });
    } catch (error: any) {
        console.error('Error fetching pending payments:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to fetch pending payments' });
    }
};

/**
 * Get payment details by invoice ID
 * GET /api/payments/:invoiceId
 */
export const getPaymentByInvoice = async (req: AuthRequest, res: Response) => {
    try {
        const { invoiceId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const patient = await Patient.findOne({ userId });
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }

        const patientId = patient._id;

        const payment = await UnifiedPayment.findOne({ invoiceId, patientId });
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        return res.status(200).json({
            success: true,
            data: { payment },
        });
    } catch (error: any) {
        console.error('Error fetching payment:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to fetch payment' });
    }
};

/**
 * Expire old pending payments (cron job)
 * POST /api/payments/expire-old
 */
export const expireOldPayments = async (req: Request, res: Response) => {
    try {
        const result = await UnifiedPayment.updateMany(
            {
                paymentStatus: 'pending',
                expiresAt: { $lt: new Date() },
            },
            {
                $set: { paymentStatus: 'expired' },
            }
        );

        return res.status(200).json({
            success: true,
            message: `Expired ${result.modifiedCount} old payments`,
            data: { expiredCount: result.modifiedCount },
        });
    } catch (error: any) {
        console.error('Error expiring old payments:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to expire old payments' });
    }
};
