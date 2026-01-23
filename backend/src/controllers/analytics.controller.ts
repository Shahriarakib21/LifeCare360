import { Request, Response, NextFunction } from 'express';
import User from '../models/mongodb/User.model';
import Appointment from '../models/postgres/Appointment.model';
import Order from '../models/postgres/Order.model';
import EHR from '../models/mongodb/EHR.model';
import LoginLog from '../models/mongodb/LoginLog.model';
import { Op } from 'sequelize';

// Get Appointment Trends (Monthly data for last 12 months)
export const getAppointmentTrends = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { months = 12 } = req.query;
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months as string));

        // Get appointments grouped by month
        const appointments = await Appointment.findAll({
            where: {
                date: {
                    [Op.gte]: monthsAgo
                }
            },
            attributes: ['date', 'status'],
            order: [['date', 'ASC']]
        });

        // Group by month
        const monthlyData = new Map<string, { total: number; completed: number; cancelled: number }>();

        appointments.forEach(apt => {
            const monthKey = new Date(apt.date).toISOString().substring(0, 7); // YYYY-MM
            const existing = monthlyData.get(monthKey) || { total: 0, completed: 0, cancelled: 0 };

            existing.total += 1;
            if (apt.status === 'completed') existing.completed += 1;
            if (apt.status === 'cancelled') existing.cancelled += 1;

            monthlyData.set(monthKey, existing);
        });

        const trends = Array.from(monthlyData.entries()).map(([month, data]) => ({
            month,
            ...data
        }));

        res.status(200).json({
            success: true,
            data: trends
        });
    } catch (error) {
        next(error);
    }
};

// Get Medicine Sales Trends (Monthly revenue for last 12 months)
export const getMedicineSalesTrends = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { months = 12 } = req.query;
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months as string));

        const orders = await Order.findAll({
            where: {
                createdAt: {
                    [Op.gte]: monthsAgo
                },
                paymentStatus: 'paid'
            },
            attributes: ['createdAt', 'totalAmount'],
            order: [['createdAt', 'ASC']]
        });

        // Group by month
        const monthlyRevenue = new Map<string, number>();

        orders.forEach(order => {
            const monthKey = new Date(order.createdAt).toISOString().substring(0, 7);
            const existing = monthlyRevenue.get(monthKey) || 0;
            monthlyRevenue.set(monthKey, existing + parseFloat(order.totalAmount.toString()));
        });

        const trends = Array.from(monthlyRevenue.entries()).map(([month, revenue]) => ({
            month,
            revenue: parseFloat(revenue.toFixed(2))
        }));

        res.status(200).json({
            success: true,
            data: trends
        });
    } catch (error) {
        next(error);
    }
};

// Get User Activity Report
export const getUserActivityReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { months = 6 } = req.query;
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months as string));

        // User registrations by month and role
        const users = await User.aggregate([
            { $match: { createdAt: { $gte: monthsAgo } } },
            {
                $group: {
                    _id: {
                        month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        role: "$role"
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.month": 1 } }
        ]);

        // Transform to easier format
        const activityByMonth = new Map<string, any>();

        users.forEach(item => {
            const month = item._id.month;
            if (!activityByMonth.has(month)) {
                activityByMonth.set(month, { month, patient: 0, doctor: 0, lab: 0, pharmacy: 0, admin: 0 });
            }
            const monthData = activityByMonth.get(month);
            monthData[item._id.role] = item.count;
        });

        const activity = Array.from(activityByMonth.values());

        res.status(200).json({
            success: true,
            data: activity
        });
    } catch (error) {
        next(error);
    }
};

// Get Role-Based Stats
export const getRoleBasedStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Parallelize MongoDB counts
        const userDistribution = await User.aggregate([
            {
                $group: {
                    _id: "$role",
                    count: { $sum: 1 }
                }
            }
        ]);

        const roles = userDistribution.reduce((acc: any, curr: any) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        // Parallelize Postgres counts
        const [totalAppointments, completedAppointments, totalOrders, paidOrders] = await Promise.all([
            Appointment.count(),
            Appointment.count({ where: { status: 'completed' } }),
            Order.count(),
            Order.count({ where: { paymentStatus: 'paid' } })
        ]);

        // Get lab tests count
        const totalLabTests = await EHR.countDocuments({ type: { $in: ['lab', 'lab-test-request'] } });

        res.status(200).json({
            success: true,
            data: {
                patients: {
                    total: roles.patient || 0,
                    appointments: totalAppointments
                },
                doctors: {
                    total: roles.doctor || 0,
                    appointmentsCompleted: completedAppointments
                },
                labs: {
                    total: roles.lab || 0,
                    testsCompleted: totalLabTests
                },
                pharmacies: {
                    total: roles.pharmacy || 0,
                    ordersFulfilled: paidOrders
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get Lab Test Trends (Monthly)
export const getLabTestTrends = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { months = 6 } = req.query;
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months as string));

        const tests = await EHR.aggregate([
            {
                $match: {
                    type: { $in: ['lab', 'lab-test-request'] },
                    createdAt: { $gte: monthsAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const trends = tests.map(t => ({
            month: t._id,
            tests: t.count
        }));

        res.status(200).json({
            success: true,
            data: trends
        });
    } catch (error) {
        next(error);
    }
};

// Get Activity Scatter Data (Engagement)
export const getActivityScatterData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Get sample of patients
        const patients = await User.find({ role: 'patient' })
            .select('profile email')
            .limit(100)
            .lean();

        const patientIds = patients.map(p => p._id);
        const patientIdStrings = patientIds.map(id => id.toString());

        // 2. Batch get login counts from Mongo
        const loginCounts = await LoginLog.aggregate([
            { $match: { userId: { $in: patientIds } } },
            { $group: { _id: "$userId", count: { $sum: 1 } } }
        ]);

        const loginMap = new Map(loginCounts.map(l => [l._id.toString(), l.count]));

        // 3. Batch get appointment counts from Postgres
        const appointmentCounts = await Appointment.findAll({
            where: {
                patientId: { [Op.in]: patientIdStrings }
            },
            attributes: [
                'patientId',
                [Appointment.sequelize!.fn('COUNT', Appointment.sequelize!.col('id')), 'count']
            ],
            group: ['patientId'],
            raw: true
        });

        const apptMap = new Map(appointmentCounts.map((a: any) => [a.patientId, parseInt(a.count)]));

        // 4. Combine data
        const scatterData = patients.map(user => {
            const logins = loginMap.get(user._id.toString()) || 0;
            const actions = apptMap.get(user._id.toString()) || 0;

            return {
                name: `${user.profile?.firstName || 'User'} ${user.profile?.lastName || user._id.toString().substring(18)}`,
                logins,
                actions,
                size: 10 + (logins * 2)
            };
        });

        res.status(200).json({
            success: true,
            data: scatterData
        });
    } catch (error) {
        next(error);
    }
};
