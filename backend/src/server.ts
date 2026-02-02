import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initSocket } from './utils/socket';
import connectDB from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import rateLimiter, { authRateLimiter } from './middleware/rateLimiter';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patient.routes';
import doctorRoutes from './routes/doctor.routes';
import pharmacyRoutes from './routes/pharmacy.routes';
import labRoutes from './routes/lab.routes';
import publicRoutes from './routes/public.routes';
import aiRoutes from './routes/ai.routes';
import hospitalRoutes from './routes/hospital.routes';
import insuranceRoutes from './routes/insurance.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';
import paymentRoutes from './routes/payment.routes';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

const PORT = process.env.PORT || 5001;

// Connect to databases
connectDB();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(cors({
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
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Serve uploaded files - must be before API routes
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders: (res, filePath) => {
    // Set appropriate headers for file downloads
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (filePath.match(/\.(jpg|jpeg|png)$/i)) {
      res.setHeader('Content-Type', 'image/jpeg');
    }
    res.setHeader('Content-Disposition', 'inline'); // Display in browser instead of download
  },
}));

// Health check (before rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Check if we're in development mode (before using it)
const isDevelopment = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

// API Routes
// Auth routes with more lenient rate limiting (must be before general rate limiter)
// Only apply rate limiting in production
if (!isDevelopment) {
  app.use('/api/auth', authRateLimiter);
}
app.use('/api/auth', authRoutes);

// Rate limiting for other API routes (excluding auth which is already handled)
// Only apply rate limiting in production
const generalRateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Skip rate limiting for auth routes (already handled above)
  if (req.path.startsWith('/auth')) {
    return next();
  }
  // Skip rate limiting entirely in development
  if (isDevelopment) {
    return next();
  }
  return rateLimiter(req, res, next);
};

app.use('/api/patients', generalRateLimiter, patientRoutes);
app.use('/api/doctors', generalRateLimiter, doctorRoutes);
app.use('/api/pharmacy', generalRateLimiter, pharmacyRoutes);
app.use('/api/labs', generalRateLimiter, labRoutes);
app.use('/api/public', generalRateLimiter, publicRoutes);
app.use('/api/ai', generalRateLimiter, aiRoutes);
app.use('/api/hospitals', generalRateLimiter, hospitalRoutes);
app.use('/api/insurance', generalRateLimiter, insuranceRoutes);
app.use('/api/admin', generalRateLimiter, adminRoutes);
app.use('/api/notifications', generalRateLimiter, notificationRoutes);
app.use('/api/payments', generalRateLimiter, paymentRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Start server with error handling for port already in use
httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
}).on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`❌ Port ${PORT} is already in use. Please run: npm run kill-port`);
    logger.error(`   Or manually kill the process: lsof -ti:${PORT} | xargs kill -9`);
    process.exit(1);
  } else {
    logger.error(`❌ Server error: ${error.message}`);
    process.exit(1);
  }
});



