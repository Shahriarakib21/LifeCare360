import { Request, Response, NextFunction } from 'express';
import User from '../models/mongodb/User.model';
import Appointment from '../models/postgres/Appointment.model';
import Order from '../models/postgres/Order.model';
import EHR from '../models/mongodb/EHR.model';
import LoginLog from '../models/mongodb/LoginLog.model';
import { Op } from 'sequelize';

// Helper to generate last N months
const getLastMonths = (n: number) => {
    const list = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(1); // Crucial to avoid month overflow (e.g. Jan 31 -> Feb 28/29)
        d.setMonth(d.getMonth() - i);
        list.push(d.toISOString().substring(0, 7));
    }
    return list;
};

// Get Appointment Trends (Monthly data for last 12 months)
export const getAppointmentTrends = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { months = 12 } = req.query;
        const nMonth = parseInt(months as string);
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - nMonth);

        const appointments = await Appointment.findAll({
            where: { date: { [Op.gte]: monthsAgo } },
            attributes: ['date', 'status'],
            order: [['date', 'ASC']]
        });

        const monthKeys = getLastMonths(nMonth);
        const monthlyData = new Map<string, any>();
        monthKeys.forEach(m => monthlyData.set(m, { month: m, total: 0, completed: 0, cancelled: 0 }));

        appointments.forEach(apt => {
            const monthKey = new Date(apt.date).toISOString().substring(0, 7);
            const existing = monthlyData.get(monthKey);
            if (existing) {
                existing.total += 1;
                if (apt.status === 'completed') existing.completed += 1;
                if (apt.status === 'cancelled') existing.cancelled += 1;
            }
        });

        res.status(200).json({
            success: true,
            data: Array.from(monthlyData.values())
        });
    } catch (error) {
        next(error);
    }
};

// Get Medicine Sales Trends (Monthly revenue for last 12 months)
export const getMedicineSalesTrends = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { months = 12 } = req.query;
        const nMonth = parseInt(months as string);
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - nMonth);

        const orders = await Order.findAll({
            where: {
                createdAt: { [Op.gte]: monthsAgo },
                paymentStatus: 'paid'
            },
            attributes: ['createdAt', 'totalAmount'],
            order: [['createdAt', 'ASC']]
        });

        const monthKeys = getLastMonths(nMonth);
        const monthlyRevenue = new Map<string, any>();
        monthKeys.forEach(m => monthlyRevenue.set(m, { month: m, revenue: 0 }));

        orders.forEach(order => {
            const monthKey = new Date(order.createdAt).toISOString().substring(0, 7);
            const existing = monthlyRevenue.get(monthKey);
            if (existing) {
                existing.revenue += parseFloat(order.totalAmount.toString());
            }
        });

        res.status(200).json({
            success: true,
            data: Array.from(monthlyRevenue.values()).map(r => ({ ...r, revenue: parseFloat(r.revenue.toFixed(2)) }))
        });
    } catch (error) {
        next(error);
    }
};

// Get User Activity Report
export const getUserActivityReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { months = 6 } = req.query;
        const nMonth = parseInt(months as string);
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - nMonth);

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

        const monthKeys = getLastMonths(nMonth);
        const activityMap = new Map<string, any>();
        monthKeys.forEach(m => activityMap.set(m, { month: m, patient: 0, doctor: 0, lab: 0, pharmacy: 0, admin: 0 }));

        users.forEach(item => {
            const month = item._id.month;
            const existing = activityMap.get(month);
            if (existing) {
                existing[item._id.role] = item.count;
            }
        });

        res.status(200).json({
            success: true,
            data: Array.from(activityMap.values())
        });
    } catch (error) {
        next(error);
    }
};

// Get Role-Based Stats
export const getRoleBasedStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userDistribution = await User.aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } }
        ]);

        const roles = userDistribution.reduce((acc: any, curr: any) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        const [totalAppointments, completedAppointments, totalOrders, paidOrders] = await Promise.all([
            Appointment.count(),
            Appointment.count({ where: { status: 'completed' } }),
            Order.count(),
            Order.count({ where: { paymentStatus: 'paid' } })
        ]);

        const totalLabTests = await EHR.countDocuments({ type: { $in: ['lab', 'lab-test-request'] } });

        res.status(200).json({
            success: true,
            data: {
                patients: { total: roles.patient || 0, appointments: totalAppointments },
                doctors: { total: roles.doctor || 0, appointmentsCompleted: completedAppointments },
                labs: { total: roles.lab || 0, testsCompleted: totalLabTests },
                pharmacies: { total: roles.pharmacy || 0, ordersFulfilled: paidOrders }
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
        const nMonth = parseInt(months as string);
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - nMonth);

        const tests = await EHR.aggregate([
            {
                $match: {
                    type: { $in: ['lab', 'lab-test-request'] },
                    date: { $gte: monthsAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const monthKeys = getLastMonths(nMonth);
        const trendsMap = new Map<string, any>();
        monthKeys.forEach(m => trendsMap.set(m, { month: m, tests: 0 }));

        tests.forEach(t => {
            if (trendsMap.has(t._id)) {
                trendsMap.get(t._id).tests = t.count;
            }
        });

        res.status(200).json({
            success: true,
            data: Array.from(trendsMap.values())
        });
    } catch (error) {
        next(error);
    }
};

// Get Activity Scatter Data (Engagement)
export const getActivityScatterData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const patients = await User.find({ role: 'patient' })
            .select('profile email')
            .limit(100)
            .lean();

        const patientIds = patients.map(p => p._id);
        const patientIdStrings = patientIds.map(id => id.toString());

        const loginCounts = await LoginLog.aggregate([
            { $match: { userId: { $in: patientIds } } },
            { $group: { _id: "$userId", count: { $sum: 1 } } }
        ]);

        const loginMap = new Map(loginCounts.map(l => [l._id.toString(), l.count]));

        const appointmentCounts = await Appointment.findAll({
            where: { patientId: { [Op.in]: patientIdStrings } },
            attributes: [
                'patientId',
                [Appointment.sequelize!.fn('COUNT', Appointment.sequelize!.col('id')), 'count']
            ],
            group: ['patientId'],
            raw: true
        });

        const apptMap = new Map(appointmentCounts.map((a: any) => [a.patientId, parseInt(a.count)]));

        const scatterData = patients.map((user: any) => {
            const logins = loginMap.get(user._id.toString()) || 0;
            const actions = apptMap.get(user._id.toString()) || 0;

            return {
                name: `${user.profile?.firstName || 'Patient'} ${user.profile?.lastName || user._id.toString().substring(18)}`,
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
