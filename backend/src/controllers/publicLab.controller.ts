import { Request, Response, NextFunction } from 'express';
import User from '../models/mongodb/User.model';
import TestPrice from '../models/mongodb/TestPrice.model';
import LabArticle from '../models/mongodb/LabArticle.model';
import { AppError } from '../middleware/errorHandler';

/**
 * Search lab tests (Public)
 */
export const searchLabTests = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { q, category, labId, page = 1, limit = 20 } = req.query;

        const query: any = { active: true };

        if (q) {
            query.$or = [
                { testName: { $regex: q as string, $options: 'i' } },
                { testCode: { $regex: q as string, $options: 'i' } },
                { description: { $regex: q as string, $options: 'i' } },
            ];
        }

        if (labId) {
            query.labId = labId;
        }

        // Category filter could be implemented if we add category to TestPrice
        // For now, we'll use name-based matching for categories if provided
        if (category) {
            query.testName = { $regex: category as string, $options: 'i' };
        }

        const offset = (Number(page) - 1) * Number(limit);

        const tests = await TestPrice.find(query)
            .populate('labId', 'profile email labDetails')
            .sort({ testName: 1 })
            .skip(offset)
            .limit(Number(limit))
            .lean();

        const total = await TestPrice.countDocuments(query);

        const formattedTests = tests.map((test: any) => ({
            id: test._id,
            name: test.testName,
            code: test.testCode,
            price: test.price,
            description: test.description,
            preparationInstructions: test.preparationInstructions,
            estimatedDeliveryTime: test.estimatedDeliveryTime,
            sampleType: test.sampleType,
            lab: {
                id: test.labId?._id,
                name: `${test.labId?.profile?.firstName || ''} ${test.labId?.profile?.lastName || ''}`.trim() || 'Laboratory',
                location: test.labId?.profile?.location,
                labDetails: test.labId?.labDetails
            }
        }));

        res.json({
            success: true,
            data: {
                tests: formattedTests,
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

/**
 * List all active laboratories (Public)
 */
export const listLabs = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { city, page = 1, limit = 12 } = req.query;

        const query: any = { role: 'lab', isActive: true };

        if (city) {
            query['profile.location.city'] = { $regex: city as string, $options: 'i' };
        }

        const offset = (Number(page) - 1) * Number(limit);

        const labs = await User.find(query)
            .select('profile email labDetails')
            .skip(offset)
            .limit(Number(limit))
            .lean();

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: {
                labs,
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

/**
 * Get detailed lab profile (Public)
 */
export const getLabProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;

        const lab = await User.findOne({ _id: id, role: 'lab', isActive: true })
            .select('profile email labDetails')
            .lean();

        if (!lab) {
            throw new AppError('Laboratory not found', 404);
        }

        // Get all tests for this lab
        const tests = await TestPrice.find({ labId: id, active: true })
            .sort({ testName: 1 })
            .lean();

        res.json({
            success: true,
            data: {
                lab,
                tests
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get prices for common tests across labs (Public)
 */
export const getCommonTests = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const commonTestNames = ['CBC', 'Blood Sugar', 'Lipid Profile', 'Urine Test', 'Hemoglobin', 'Creatinine', 'HBA1C'];

        // For each common test, find a sample of prices from different labs
        const results = await Promise.all(commonTestNames.map(async (name) => {
            const tests = await TestPrice.find({
                testName: { $regex: name, $options: 'i' },
                active: true
            })
                .populate('labId', 'profile labDetails')
                .limit(5)
                .lean();

            return {
                testName: name,
                providers: tests.map((t: any) => ({
                    labId: t.labId?._id,
                    labName: `${t.labId?.profile?.firstName || ''} ${t.labId?.profile?.lastName || ''}`.trim(),
                    price: t.price,
                    location: t.labId?.profile?.location?.city
                }))
            };
        }));

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get educational lab articles (Public)
 */
export const getLabArticles = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const articles = await LabArticle.find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(6)
            .lean();

        res.json({
            success: true,
            data: articles
        });
    } catch (error) {
        next(error);
    }
};
