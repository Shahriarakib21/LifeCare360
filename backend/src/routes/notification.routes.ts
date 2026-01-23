import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
} from '../controllers/notification.controller';

const router = express.Router();

// Protect all routes
router.use(authenticate);

router.get('/', getUserNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/mark-all-read', markAllAsRead);

export default router;
