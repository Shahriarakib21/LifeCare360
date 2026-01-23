import { Request, Response, NextFunction } from 'express';
import User from '../models/mongodb/User.model';
import Appointment from '../models/postgres/Appointment.model';
import Order from '../models/postgres/Order.model';
import Patient from '../models/mongodb/Patient.model';
import EHR from '../models/mongodb/EHR.model';
import AuditLog from '../models/mongodb/AuditLog.model';
import LoginLog from '../models/mongodb/LoginLog.model';
import SystemSettings from '../models/mongodb/SystemSettings.model';
import RevenueTransaction from '../models/mongodb/RevenueTransaction.model';
import { AppError } from '../middleware/errorHandler';
import { Op } from 'sequelize';
import { Parser } from 'json2csv';
import mongoose from 'mongoose';

// Get Dashboard Stats
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [
            totalUsers,
            totalDoctors,
            totalPatients,
            totalLabTests,
            totalAppointments,
            totalPrescriptions,
            revenueStats
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'doctor' }),
            User.countDocuments({ role: 'patient' }),
            EHR.countDocuments({ type: { $in: ['lab', 'lab-test-request'] } }),
            Appointment.count(),
            EHR.countDocuments({ type: 'prescription' }),
            RevenueTransaction.aggregate([
                { $group: { _id: "$type", total: { $sum: "$amount" } } }
            ])
        ]);

        const revenueMap: Record<string, number> = {
            doctor: 0,
            lab: 0,
            pharmacy: 0
        };

        revenueStats.forEach(stat => {
            if (revenueMap.hasOwnProperty(stat._id)) {
                revenueMap[stat._id] = stat.total;
            }
        });

        const totalRevenue = revenueMap.doctor + revenueMap.lab + revenueMap.pharmacy;

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalDoctors,
                totalPatients,
                totalLabTests,
                totalAppointments,
                totalPrescriptions,
                totalRevenue,
                revenueBreakdown: {
                    doctor: revenueMap.doctor,
                    lab: revenueMap.lab,
                    pharmacy: revenueMap.pharmacy
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get Analytics Data
export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. User Registrations Over Time (Last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Aggregation for MongoDB (User)
        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 2. User Distribution (Pie Chart)
        const userDistribution = await User.aggregate([
            {
                $group: {
                    _id: "$role",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                userGrowth,
                userDistribution
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get All Users (with pagination & search)
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const role = req.query.role as string;

        const query: any = {};

        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { 'profile.firstName': { $regex: search, $options: 'i' } },
                { 'profile.lastName': { $regex: search, $options: 'i' } }
            ];
        }

        if (role && role !== 'all') {
            query.role = role;
        }

        const users = await User.find(query)
            .select('-password') // Exclude password
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get User by ID
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password');

        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// Update User
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Prevent updating password directly via this route if unsafe, but Admin should be able to.
        // Ideally use dedicated route for password. For now, allow general updates.

        const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password');

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Log the action
        await AuditLog.create({
            adminId: (req as any).user.id,
            action: 'UPDATE_USER',
            targetUserId: user._id,
            details: { updates },
            ipAddress: req.ip
        });

        res.status(200).json({
            success: true,
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

// Delete User
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Log the action
        await AuditLog.create({
            adminId: (req as any).user.id,
            action: 'DELETE_USER',
            targetUserId: user._id,
            details: { email: user.email, role: user.role },
            ipAddress: req.ip
        });

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Reset User Password
export const resetUserPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            throw new AppError('Password must be at least 6 characters', 400);
        }

        const user = await User.findById(id).select('+password');
        if (!user) {
            throw new AppError('User not found', 404);
        }

        user.password = password;
        // Invalidate sessions if using token versioning (not implemented yet, but good practice comment)
        // user.tokenVersion += 1; 

        await user.save();

        // Log the action
        await AuditLog.create({
            adminId: (req as any).user.id,
            action: 'RESET_PASSWORD',
            targetUserId: user._id,
            details: { email: user.email },
            ipAddress: req.ip
        });

        console.log(`AUDIT: Password reset for user ${user.email} (${user._id}) by Admin at ${new Date().toISOString()}`);

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Toggle User Active Status
export const toggleUserStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        user.isActive = !user.isActive;
        await user.save();

        // Log the action
        await AuditLog.create({
            adminId: (req as any).user.id,
            action: user.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
            targetUserId: user._id,
            details: { email: user.email, newStatus: user.isActive ? 'active' : 'inactive' },
            ipAddress: req.ip
        });

        res.status(200).json({
            success: true,
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            data: { isActive: user.isActive }
        });
    } catch (error) {
        next(error);
    }
};

// Get Patients Only
export const getPatients = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;

        const query: any = { role: 'patient' };

        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { 'profile.firstName': { $regex: search, $options: 'i' } },
                { 'profile.lastName': { $regex: search, $options: 'i' } }
            ];
        }

        const patients = await User.find(query)
            .select('-password')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        // Get appointment count for each patient
        const patientsWithStats = await Promise.all(
            patients.map(async (patient) => {
                const appointmentCount = await Appointment.count({
                    where: { patientId: patient._id.toString() }
                });
                return {
                    ...patient.toObject(),
                    stats: { appointments: appointmentCount }
                };
            })
        );

        res.status(200).json({
            success: true,
            data: {
                patients: patientsWithStats,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get Doctors Only
export const getDoctors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;

        const query: any = { role: 'doctor' };

        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { 'profile.firstName': { $regex: search, $options: 'i' } },
                { 'profile.lastName': { $regex: search, $options: 'i' } }
            ];
        }

        const doctors = await User.find(query)
            .select('-password')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                doctors,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get Lab Users Only
export const getLabUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;

        const query: any = { role: 'lab' };

        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { 'profile.firstName': { $regex: search, $options: 'i' } },
                { 'profile.lastName': { $regex: search, $options: 'i' } }
            ];
        }

        const labs = await User.find(query)
            .select('-password')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                labs,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get Pharmacy Users Only
export const getPharmacyUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;

        const query: any = { role: 'pharmacy' };

        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { 'profile.firstName': { $regex: search, $options: 'i' } },
                { 'profile.lastName': { $regex: search, $options: 'i' } }
            ];
        }

        const pharmacies = await User.find(query)
            .select('-password')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                pharmacies,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get System Settings
export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({
                maintenanceMode: false,
                allowRegistration: true,
                contactEmail: 'admin@healthcare.com',
                updatedBy: (req as any).user.id
            });
        }
        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        next(error);
    }
};

// Update System Settings
export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updates = req.body;
        let settings = await SystemSettings.findOne();

        if (settings) {
            settings = await SystemSettings.findByIdAndUpdate(
                settings._id,
                { ...updates, updatedBy: (req as any).user.id },
                { new: true, runValidators: true }
            );
        } else {
            settings = await SystemSettings.create({
                ...updates,
                updatedBy: (req as any).user.id
            });
        }

        // Log the action
        await AuditLog.create({
            adminId: (req as any).user.id,
            action: 'UPDATE_SETTINGS',
            details: updates,
            ipAddress: req.ip
        });

        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        next(error);
    }
};

// Get User Activity History (Combined Login and Audit Logs)
export const getUserActivityHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Fetch last 10 login logs
        const loginLogs = await LoginLog.find({ userId: id })
            .sort({ timestamp: -1 })
            .limit(10);

        // Fetch last 10 audit logs related to this user (as target)
        // Note: Our current AuditLog model has targetId
        const auditLogs = await AuditLog.find({ targetId: id })
            .sort({ timestamp: -1 })
            .limit(10);

        // Combine and format logs
        const combinedLogs = [
            ...loginLogs.map(log => ({
                id: log._id,
                type: 'LOGIN',
                action: 'User Login',
                description: `Login from IP: ${log.ipAddress}`,
                timestamp: log.timestamp,
                status: 'success'
            })),
            ...auditLogs.map(log => ({
                id: log._id,
                type: 'ADMIN_ACTION',
                action: log.action,
                description: `Admin action performed: ${log.action}`,
                timestamp: log.timestamp,
                status: 'info'
            }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        res.status(200).json({
            success: true,
            data: combinedLogs
        });
    } catch (error) {
        next(error);
    }
};
/**
 * Get Revenue Summary (Aggregated totals)
 */
export const getRevenueSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await RevenueTransaction.aggregate([
            {
                $group: {
                    _id: "$type",
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const summary = {
            total: stats.reduce((acc, curr) => acc + curr.totalAmount, 0),
            doctor: stats.find(s => s._id === 'doctor')?.totalAmount || 0,
            lab: stats.find(s => s._id === 'lab')?.totalAmount || 0,
            pharmacy: stats.find(s => s._id === 'pharmacy')?.totalAmount || 0,
            counts: {
                doctor: stats.find(s => s._id === 'doctor')?.count || 0,
                lab: stats.find(s => s._id === 'lab')?.count || 0,
                pharmacy: stats.find(s => s._id === 'pharmacy')?.count || 0,
            }
        };

        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Revenue Analytics (Time-based metrics)
 */
export const getRevenueAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { period = 'monthly', startDate, endDate } = req.query;

        const match: any = {};
        if (startDate || endDate) {
            match.date = {};
            if (startDate) match.date.$gte = new Date(startDate as string);
            if (endDate) match.date.$lte = new Date(endDate as string);
        }

        let dateFormat = "%Y-%m-%d";
        if (period === 'monthly') dateFormat = "%Y-%m";
        if (period === 'yearly') dateFormat = "%Y";

        const analytics = await RevenueTransaction.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: dateFormat, date: "$date" } },
                        type: "$type"
                    },
                    amount: { $sum: "$amount" }
                }
            },
            {
                $group: {
                    _id: "$_id.date",
                    doctor: { $sum: { $cond: [{ $eq: ["$_id.type", "doctor"] }, "$amount", 0] } },
                    lab: { $sum: { $cond: [{ $eq: ["$_id.type", "lab"] }, "$amount", 0] } },
                    pharmacy: { $sum: { $cond: [{ $eq: ["$_id.type", "pharmacy"] }, "$amount", 0] } },
                    total: { $sum: "$amount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Revenue Breakdown (Filterable list)
 */
export const getRevenueBreakdown = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type, startDate, endDate, page = 1, limit = 10, paymentMethod } = req.query;

        const query: any = {};
        if (type && type !== 'all') query.type = type;
        if (paymentMethod && paymentMethod !== 'all') query.paymentMethod = paymentMethod;

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate as string);
            if (endDate) {
                const end = new Date(endDate as string);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        const skip = (Number(page) - 1) * Number(limit);

        const transactions = await RevenueTransaction.find(query)
            .populate('patientUserId', 'profile email')
            .populate('providerUserId', 'profile email role')
            .sort({ date: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await RevenueTransaction.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                transactions,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Export Revenue Report (CSV)
 */
export const exportRevenueReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type, startDate, endDate } = req.query;

        const query: any = {};
        if (type && type !== 'all') query.type = type;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate as string);
            if (endDate) {
                const end = new Date(endDate as string);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        const transactions = await RevenueTransaction.find(query)
            .populate('patientUserId', 'profile email')
            .populate('providerUserId', 'profile email role')
            .sort({ date: -1 });

        const fields = [
            { label: 'Date', value: (row: any) => row.date.toISOString().split('T')[0] },
            { label: 'Type', value: 'type' },
            { label: 'Amount (BDT)', value: 'amount' },
            { label: 'Payment Method', value: 'paymentMethod' },
            { label: 'Transaction ID', value: 'transactionId' },
            { label: 'Patient', value: (row: any) => row.patientUserId?.email || 'N/A' },
            { label: 'Provider', value: (row: any) => row.providerUserId?.email || 'N/A' },
            { label: 'Service ID', value: 'serviceId' }
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(transactions);

        res.header('Content-Type', 'text/csv');
        res.attachment(`revenue-report-${new Date().toISOString().split('T')[0]}.csv`);
        res.status(200).send(csv);
    } catch (error) {
        next(error);
    }
};

/**
 * Get Lab Revenue Data (Admin)
 */
export const getAdminLabRevenue = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate, labId } = req.query;

        const query: any = { type: 'lab' };
        if (labId && labId !== 'all') query.providerUserId = labId;

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate as string);
            if (endDate) {
                const end = new Date(endDate as string);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        const stats = await RevenueTransaction.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$providerUserId",
                    totalRevenue: { $sum: "$amount" },
                    testCount: { $sum: { $ifNull: ["$metadata.testCount", 1] } },
                    transactionCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "labInfo"
                }
            },
            { $unwind: "$labInfo" },
            {
                $project: {
                    labId: "$_id",
                    labName: { $concat: ["$labInfo.profile.firstName", " ", "$labInfo.profile.lastName"] },
                    totalRevenue: 1,
                    testCount: 1,
                    transactionCount: 1,
                    email: "$labInfo.email"
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Lab Performance Stats (Admin)
 */
export const getAdminLabStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate } = req.query;

        const query: any = { type: 'lab-test-request' };
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate as string);
            if (endDate) {
                const end = new Date(endDate as string);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        const stats = await EHR.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$data.labTestRequest.status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStats = {
            total: stats.reduce((acc, curr) => acc + curr.count, 0),
            completed: stats.find(s => s._id === 'COMPLETED' || s._id === 'REPORT_UPLOADED' || s._id === 'completed')?.count || 0,
            pending: stats.find(s => ['PENDING_PAYMENT', 'PAID', 'REQUESTED', 'ASSIGNED', 'SAMPLE_COLLECTED', 'IN_PROGRESS'].includes(s._id))?.count || 0,
            failed: stats.find(s => s._id === 'FAILED')?.count || 0
        };

        res.status(200).json({
            success: true,
            data: formattedStats
        });
    } catch (error) {
        next(error);
    }
};
