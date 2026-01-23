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
