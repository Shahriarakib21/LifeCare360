import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Appointment from '../models/postgres/Appointment.model';
import Doctor from '../models/postgres/Doctor.model';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { Op, fn, col } from 'sequelize';

/**
 * Get financial report for the logged-in doctor
 */
export const getDoctorEarningsReport = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.id;

        // Find the doctor record in PostgreSQL
        const doctor = await Doctor.findOne({ where: { userId } });
        if (!doctor) {
            // Return empty stats if doctor profile not found yet
            res.json({
                success: true,
                data: {
                    summary: [],
                    history: [],
                    growth: 0,
                    currentMonthEarnings: 0,
                    lastMonthEarnings: 0
                }
            });
            return;
        }

        const doctorId = doctor.id;

        // Aggregate earnings by status
        const earningsByStatus = await Appointment.findAll({
            where: {
                doctorId,
                visitFee: { [Op.ne]: null } as any,
            },
            attributes: [
                'feeStatus',
                [fn('SUM', col('visitFee')), 'totalAmount'],
                [fn('COUNT', col('id')), 'count'],
            ],
            group: ['feeStatus'],
        });

        // Normalize decimals for counts
        const summary = earningsByStatus.map((s: any) => ({
            ...s.toJSON(),
            totalAmount: parseFloat(s.get('totalAmount') || 0),
            count: parseInt(s.get('count') || 0)
        }));

        // Calculate Month-over-Month Growth
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const currentMonthEarnings = await Appointment.sum('visitFee', {
            where: {
                doctorId,
                feeStatus: 'paid',
                date: { [Op.gte]: startOfCurrentMonth }
            }
        });

        const lastMonthEarnings = await Appointment.sum('visitFee', {
            where: {
                doctorId,
                feeStatus: 'paid',
                date: { [Op.between]: [startOfLastMonth, endOfLastMonth] }
            }
        });

        let growth = 0;
        if (lastMonthEarnings && lastMonthEarnings > 0) {
            growth = ((currentMonthEarnings || 0) - lastMonthEarnings) / lastMonthEarnings * 100;
        } else if (currentMonthEarnings && currentMonthEarnings > 0) {
            growth = 100; // First month with earnings
        }

        // Aggregate earnings over time (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const earningsOverTime = await Appointment.findAll({
            where: {
                doctorId,
                visitFee: { [Op.not]: null } as any,
                date: { [Op.gte]: thirtyDaysAgo },
            },
            attributes: [
                'date',
                [fn('SUM', col('visitFee')), 'dailyTotal'],
            ],
            group: ['date'],
            order: [['date', 'ASC']],
        });

        const history = earningsOverTime.map((h: any) => ({
            ...h.toJSON(),
            dailyTotal: parseFloat(h.get('dailyTotal') || 0)
        }));

        res.json({
            success: true,
            data: {
                summary,
                history,
                growth: parseFloat(growth.toFixed(1)),
                currentMonthEarnings: currentMonthEarnings || 0,
                lastMonthEarnings: lastMonthEarnings || 0
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get detailed transaction list for the doctor
 */
export const getDoctorTransactions = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user!.id;
        const doctor = await Doctor.findOne({ where: { userId } });
        if (!doctor) {
            res.json({
                success: true,
                data: {
                    transactions: [],
                }
            });
            return;
        }

        const appointments = await Appointment.findAll({
            where: {
                doctorId: doctor.id,
                visitFee: { [Op.not]: null } as any,
            },
            order: [['date', 'DESC'], ['time', 'DESC']],
            limit: 50,
        });

        // Resolve patient names from MongoDB
        const patientIds = Array.from(new Set(appointments.map(a => a.patientId)));
        let patientMap = new Map();

        if (patientIds.length > 0) {
            const Patient = (await import('../models/mongodb/Patient.model')).default;
            const mongoose = await import('mongoose');

            const validObjectIds = patientIds
                .filter(id => id && mongoose.Types.ObjectId.isValid(id))
                .map(id => new mongoose.Types.ObjectId(id));

            if (validObjectIds.length > 0) {
                const patients = await Patient.find({
                    _id: { $in: validObjectIds }
                }).populate('userId', 'profile email');

                patients.forEach((p: any) => {
                    const profile = p.userId?.profile;
                    const name = profile ? `${profile.firstName} ${profile.lastName}`.trim() : (p.userId?.email || 'Unknown Patient');
                    patientMap.set(p._id.toString(), name);
                });
            }
        }

        const transactions = appointments.map(apt => {
            const data = apt.toJSON();
            return {
                ...data,
                patientName: patientMap.get(apt.patientId) || 'Deleted Patient'
            };
        });

        res.json({
            success: true,
            data: {
                transactions,
            },
        });
    } catch (error) {
        next(error);
    }
};
