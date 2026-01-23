import { Request, Response, NextFunction } from 'express';
import Appointment from '../models/postgres/Appointment.model';
import Order from '../models/postgres/Order.model';
import EHR from '../models/mongodb/EHR.model';
import { AppError } from '../middleware/errorHandler';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import User from '../models/mongodb/User.model';
import Doctor from '../models/postgres/Doctor.model';

// Helper to populate user details
const populateUserDetails = async (items: any[], userFields: string[]) => {
    const userIds = new Set<string>();
    items.forEach(item => {
        userFields.forEach(field => {
            const val = item[field] || item.getDataValue(field); // Handle Sequelize instance or plain object
            if (val) userIds.add(val);
        });
    });

    if (userIds.size === 0) return items;

    try {
        const users = await User.find({
            _id: { $in: Array.from(userIds) }
        }).select('email profile.firstName profile.lastName');

        const userMap = new Map();
        users.forEach(user => {
            userMap.set(user._id.toString(), user);
        });

        return items.map(item => {
            const plainItem = item.get ? item.get({ plain: true }) : item;
            const populatedItem: any = { ...plainItem };

            userFields.forEach(field => {
                const val = plainItem[field];
                if (val) {
                    populatedItem[`${field}Details`] = userMap.get(val.toString());
                }
            });
            return populatedItem;
        });
    } catch (error) {
        console.error('Error populating user details:', error);
        return items; // Return original items if population fails
    }
};

// Helper to populate Doctor details from Postgres
const populateDoctorDetails = async (items: any[]) => {
    const doctorIds = new Set<number>();
    items.forEach(item => {
        if (item.doctorId) doctorIds.add(item.doctorId);
    });

    if (doctorIds.size === 0) return items;

    try {
        const doctors = await Doctor.findAll({
            where: {
                id: { [Op.in]: Array.from(doctorIds) }
            },
            attributes: ['id', 'userId', 'specialization', 'department']
        });

        // We also need the User details for the doctor name
        const doctorUserIds = doctors.map(d => d.userId);
        const users = await User.find({
            _id: { $in: doctorUserIds }
        }).select('email profile.firstName profile.lastName');

        const userMap = new Map();
        users.forEach(user => {
            userMap.set(user._id.toString(), user);
        });

        const doctorMap = new Map();
        doctors.forEach(doc => {
            const user = userMap.get(doc.userId);
            doctorMap.set(doc.id, { ...doc.get({ plain: true }), userDetails: user });
        });

        return items.map(item => {
            if (item.doctorId && doctorMap.has(item.doctorId)) {
                return { ...item, doctorDetails: doctorMap.get(item.doctorId) };
            }
            return item;
        });

    } catch (error) {
        console.error('Error populating doctor details:', error);
        return items;
    }
}


// Get Appointments Report
export const getAppointmentReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate, status, doctorId } = req.query;

        const where: any = {};
        if (status) where.status = status;
        if (doctorId) where.doctorId = doctorId;

        if (startDate && endDate) {
            where.date = {
                [Op.between]: [startDate, endDate]
            };
        }

        const appointments = await Appointment.findAll({
            where,
            order: [['date', 'DESC']],
        });

        // Populate Patient (MongoDB) details
        let populated = await populateUserDetails(appointments, ['patientId']);

        // Populate Doctor (Postgres + MongoDB) details
        populated = await populateDoctorDetails(populated);

        res.status(200).json({
            success: true,
            count: populated.length,
            data: populated
        });
    } catch (error) {
        console.error('Error in getAppointmentReport:', error);
        next(error);
    }
};

// Get Medicine Sales Report
export const getSalesReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate } = req.query;
        const where: any = {
            paymentStatus: 'paid' // Only count paid orders
        };

        if (startDate && endDate) {
            where.createdAt = {
                [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
            };
        }

        const orders = await Order.findAll({
            where,
            order: [['createdAt', 'DESC']],
        });

        // Aggregating sales by Medicine Name
        const medicineSalesMap = new Map<string, {
            medicineName: string,
            quantitySold: number,
            totalRevenue: number,
            pharmacyName: string, // Assuming we can get this or it's just 'System Pharmacy' for now
            count: number
        }>();

        orders.forEach(order => {
            order.items.forEach((item: any) => {
                const existing = medicineSalesMap.get(item.name) || {
                    medicineName: item.name,
                    quantitySold: 0,
                    totalRevenue: 0,
                    pharmacyName: 'Main Pharmacy',
                    count: 0
                };

                existing.quantitySold += item.quantity || 1;
                existing.totalRevenue += (item.price * (item.quantity || 1));
                existing.count += 1;

                medicineSalesMap.set(item.name, existing);
            });
        });

        const aggregatedSales = Array.from(medicineSalesMap.values());

        res.status(200).json({
            success: true,
            count: aggregatedSales.length,
            data: aggregatedSales,
            rawOrders: orders.length // Optional: for debugging
        });
    } catch (error) {
        next(error);
    }
};

// Get Lab Tests Report
export const getLabTestsReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate, status, type } = req.query;
        const query: any = { type: 'lab-test-request' }; // Specifically looking for requests, or 'lab' for results? requests likely contain status/billing info

        if (status) {
            query['data.labTestRequest.status'] = status;
        }

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string)
            };
        }

        // Fetching records
        const tests = await EHR.find(query)
            .sort({ createdAt: -1 })
            .populate('patientId', 'email profile.firstName profile.lastName')
            .populate('data.labTestRequest.labId', 'email profile.firstName profile.lastName'); // Lab User Details


        const formattedTests = tests.map(test => {
            const reqData = (test.data?.labTestRequest || {}) as any;
            return {
                id: test._id,
                testName: reqData.testName || 'Unknown Test',
                patientDetails: test.patientId,
                labDetails: reqData.labId, // This is the populated Lab User
                date: test.createdAt,
                status: reqData.status,
                cost: reqData.price || 0,
                doctorName: (test as any).performedBy || 'System' // 'performedBy' is usually doctor name/ID string in some EHR models
            };
        });

        res.status(200).json({
            success: true,
            count: formattedTests.length,
            data: formattedTests
        });
    } catch (error) {
        next(error);
    }
};

// Get Users Report
export const getUsersReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { role, startDate, endDate, search } = req.query;
        const query: any = {};

        if (role && role !== 'all') {
            query.role = role;
        }

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string)
            };
        }

        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { 'profile.firstName': { $regex: search, $options: 'i' } },
                { 'profile.lastName': { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
};

// Get Consolidated Report (Main CSV)
export const getConsolidatedReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate } = req.query;
        const dateRangeQuery: any = {};
        const postgresDateRangeWhere: any = {};

        if (startDate && endDate) {
            const start = new Date(startDate as string);
            const end = new Date(endDate as string);
            dateRangeQuery.createdAt = { $gte: start, $lte: end };
            postgresDateRangeWhere.createdAt = { [Op.between]: [start, end] };
        }

        // 1. Get Appointment Stats
        const appointmentStats = await Appointment.findAll({
            where: {
                ...postgresDateRangeWhere,
                status: 'completed'
            },
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
                [sequelize.fn('SUM', sequelize.col('visitFee')), 'revenue']
            ],
            raw: true
        });

        // 2. Get Medicine Sales Stats
        const orderStats = await Order.findAll({
            where: {
                ...postgresDateRangeWhere,
                paymentStatus: 'paid'
            },
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
                [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
            ],
            raw: true
        });

        // 3. Get Lab Test Stats
        const labQuery = {
            type: 'lab-test-request',
            ...dateRangeQuery
        };
        const labTests = await EHR.find(labQuery);
        const labRevenue = labTests.reduce((acc, test) => {
            const price = (test.data as any)?.labTestRequest?.price || 0;
            return acc + price;
        }, 0);

        // 4. Get User Stats
        const userStats = await User.aggregate([
            { $match: dateRangeQuery },
            { $group: { _id: "$role", count: { $sum: 1 } } }
        ]);

        const consolidatedData = {
            appointments: {
                completed: (appointmentStats[0] as any).total || 0,
                revenue: parseFloat((appointmentStats[0] as any).revenue || 0)
            },
            pharmacy: {
                orders: (orderStats[0] as any).total || 0,
                revenue: parseFloat((orderStats[0] as any).revenue || 0)
            },
            lab: {
                tests: labTests.length,
                revenue: labRevenue
            },
            users: userStats.reduce((acc: any, curr: any) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            totalRevenue:
                parseFloat((appointmentStats[0] as any).revenue || 0) +
                parseFloat((orderStats[0] as any).revenue || 0) +
                labRevenue
        };

        res.status(200).json({
            success: true,
            data: consolidatedData
        });

    } catch (error) {
        next(error);
    }
};
