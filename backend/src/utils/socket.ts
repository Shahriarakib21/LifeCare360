import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { logger } from './logger';

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer): Server => {
    io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                const allowedOrigins = process.env.CORS_ORIGIN
                    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
                    : ['http://localhost:3000', 'http://localhost:3001'];
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        logger.info(`Client connected: ${socket.id}`);

        socket.on('join-room', (roomId: string) => {
            socket.join(roomId);
            logger.info(`Client ${socket.id} joined room: ${roomId}`);
        });

        socket.on('leave-room', (roomId: string) => {
            socket.leave(roomId);
            logger.info(`Client ${socket.id} left room: ${roomId}`);
        });

        socket.on('disconnect', () => {
            logger.info(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = (): Server => {
    if (!io) {
        throw new Error('Socket.io not initialized. Call initSocket first.');
    }
    return io;
};

/**
 * Send a real-time notification to a specific user
 * @param userId The ID of the user to notify
 * @param notification The notification object to send
 */
export const sendNotificationToUser = (userId: string, notification: any) => {
    try {
        const io = getIO();
        // Emit to the user's specific room (joined by frontend on login)
        io.to(userId.toString()).emit('notification', notification);
        logger.info(`Notification sent to user ${userId}: ${notification.type}`);
    } catch (error) {
        logger.error(`Failed to send notification to user ${userId}:`, error);
    }
};
