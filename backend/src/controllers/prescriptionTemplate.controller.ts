import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import PrescriptionTemplate from '../models/mongodb/PrescriptionTemplate.model';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

/**
 * Get all templates for the logged-in doctor
 */
export const getTemplates = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const doctorId = req.user!.id;

        const templates = await PrescriptionTemplate.find({
            $or: [
                { doctorId },
                { isPublic: true }
            ]
        }).sort({ name: 1 });

        res.json({
            success: true,
            data: { templates },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new prescription template
 */
export const createTemplate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const doctorId = req.user!.id;
        const { name, medications, diagnosis, notes, isPublic } = req.body;

        if (!name || !medications || !Array.isArray(medications) || medications.length === 0) {
            throw new AppError('Name and at least one medication are required', 400);
        }

        const template = await PrescriptionTemplate.create({
            doctorId,
            name,
            medications,
            diagnosis,
            notes,
            isPublic: !!isPublic,
        });

        res.status(201).json({
            success: true,
            message: 'Template created successfully',
            data: { template },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a template
 */
export const deleteTemplate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const doctorId = req.user!.id;
        const { templateId } = req.params;

        const template = await PrescriptionTemplate.findOne({
            _id: templateId,
            doctorId,
        });

        if (!template) {
            throw new AppError('Template not found or unauthorized', 404);
        }

        await PrescriptionTemplate.deleteOne({ _id: templateId });

        res.json({
            success: true,
            message: 'Template deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};
