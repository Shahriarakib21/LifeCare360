import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Order from '../models/postgres/Order.model';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import Patient from '../models/mongodb/Patient.model';
import User from '../models/mongodb/User.model';

export const createPrescriptionOrder = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.id;
        const { prescriptionId, medicines, pharmacyId, shippingAddress, paymentMethod } = req.body;

        logger.info(`Creating prescription order for user: ${userId}, pharmacy: ${pharmacyId}`);
        logger.info('Medicines:', JSON.stringify(medicines));

        // Find patient profile associated with user
        const patientUser = await User.findById(userId);
        if (!patientUser) {
            logger.error(`User not found: ${userId}`);
            throw new AppError('User not found', 404);
        }

        const patient = await Patient.findOne({ userId: patientUser._id });

        if (!patient) {
            logger.error(`Patient profile not found for user: ${userId}`);
            throw new AppError('Patient profile not found', 404);
        }

        logger.info(`Found patient: ${patient._id}`);

        // Calculate total amount (mocked for now as we don't have price in request)
        // In real app, we would fetch prices from Medicine catalog or Pharmacy's price list
        const totalAmount = medicines.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0);

        const order = await Order.create({
            patientId: patient._id.toString(), // Use MongoDB Patient ID string
            patientName: patient.fullName || patientUser.fullName,
            patientEmail: patientUser.email,
            items: medicines.map((m: any) => ({
                medicineId: m.medicineId,
                quantity: m.quantity,
                name: m.name,
                price: m.price || 0 // Default to 0 if not provided
            })),
            totalAmount: totalAmount || 0,
            shippingAddress,
            paymentMethod: paymentMethod || 'cash',
            status: 'pending',
            paymentStatus: 'pending',
            pharmacyUserId: pharmacyId, // Assumes pharmacyId passed is the User ID of pharmacy
            prescriptionId
        });

        res.status(201).json({
            success: true,
            data: { order }
        });
    } catch (error) {
        logger.error('Error creating prescription order:', error);
        next(error);
    }
};
