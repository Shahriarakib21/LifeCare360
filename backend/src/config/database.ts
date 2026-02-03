import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection (for EHR & patient history)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthlife';

// PostgreSQL connection (for structured data)
const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'healthlife',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || 'postgres',
  {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    dialect: 'postgres',
    logging: (msg) => {
      // Only log non-SELECT statements to reduce noise, or log everything for now
      logger.info(msg);
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Connect to MongoDB
const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.error('❌ MongoDB connection error (continuing...):', error);
  }
};

// Connect to PostgreSQL
const connectPostgreSQL = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('✅ PostgreSQL connected successfully');

    // Sync models
    await sequelize.sync({ alter: true });
    logger.info('✅ PostgreSQL models synced successfully');
  } catch (error) {
    logger.warn('⚠️  PostgreSQL connection error (continuing without PostgreSQL):', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      error
    });
  }
};

// Connect to both databases
const connectDB = async (): Promise<void> => {
  await connectMongoDB();
  await connectPostgreSQL();
};

export { sequelize };
export default connectDB;
