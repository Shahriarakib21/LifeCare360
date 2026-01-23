import { Request, Response } from 'express';
import Notification from '../models/mongodb/Notification.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const getUserNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments({ userId });
        const unreadCount = await Notification.countDocuments({ userId, read: false });

        res.status(200).json({
            status: 'success',
            data: {
                notifications,
                unreadCount,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching notifications'
        });
    }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const count = await Notification.countDocuments({ userId, read: false });

        res.status(200).json({
            status: 'success',
            data: { count }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching unread count'
        });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId },
            { read: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                status: 'error',
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { notification }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error marking notification as read'
        });
    }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        await Notification.updateMany(
            { userId, read: false },
            { read: true, readAt: new Date() }
        );

        res.status(200).json({
            status: 'success',
            message: 'All notifications marked as read'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error marking all as read'
        });
    }
};
