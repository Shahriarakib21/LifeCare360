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
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 5,
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
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Connect to PostgreSQL
const connectPostgreSQL = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('✅ PostgreSQL connected successfully');

    // Sync models - alter existing tables to add new columns
    await sequelize.sync({ alter: true });
    logger.info('✅ PostgreSQL schema synchronized');
  } catch (error) {
    logger.warn('⚠️  PostgreSQL connection error (continuing without PostgreSQL):', error);
    // Don't exit - allow server to run without PostgreSQL for development
    // Some features requiring PostgreSQL won't work, but basic API will function
  }
};

// Connect to both databases
const connectDB = async (): Promise<void> => {
  await connectMongoDB();
  await connectPostgreSQL();
};

export { sequelize };
export default connectDB;

