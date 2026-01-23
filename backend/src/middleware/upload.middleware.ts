import multer from 'multer';
import { Request } from 'express';
import { AppError } from './errorHandler';
import AWS from 'aws-sdk';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

// Memory storage for multer
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, PDF, and CSV/Excel are allowed', 400));
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Upload to local storage (development fallback)
const uploadToLocal = async (
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<string> => {
  const uploadsDir = path.join(process.cwd(), 'uploads', folder);

  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileExtension = path.extname(file.originalname);
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
  const filePath = path.join(uploadsDir, fileName);

  // Write file to disk
  await promisify(fs.writeFile)(filePath, file.buffer);

  // Return full URL for local development
  const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5001}`;
  return `${baseUrl}/uploads/${folder}/${fileName}`;
};

// Upload to S3
export const uploadToS3 = async (
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<string> => {
  // Check if AWS credentials are configured
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    // Development fallback: store locally
    console.warn('AWS credentials not configured. Using local file storage for development.');
    return uploadToLocal(file, folder);
  }

  const fileExtension = path.extname(file.originalname);
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;

  const params: AWS.S3.PutObjectRequest = {
    Bucket: process.env.AWS_S3_BUCKET || 'healthlife-storage',
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    // Remove ACL as it may not be supported in all S3 configurations
    // ACL: 'private',
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error: any) {
    console.error('S3 Upload Error:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      bucket: params.Bucket,
    });

    // Provide more detailed error message
    if (error.code === 'CredentialsError') {
      throw new AppError('AWS credentials are invalid or not configured', 500);
    } else if (error.code === 'NoSuchBucket') {
      throw new AppError(`S3 bucket "${params.Bucket}" does not exist`, 500);
    } else if (error.code === 'AccessDenied') {
      throw new AppError('Access denied to S3 bucket. Check IAM permissions.', 500);
    } else {
      throw new AppError(`Failed to upload file to S3: ${error.message || 'Unknown error'}`, 500);
    }
  }
};

// Generate presigned URL for private files
export const getPresignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET || 'healthlife-storage',
    Key: key,
    Expires: expiresIn,
  };

  try {
    return s3.getSignedUrlPromise('getObject', params);
  } catch (error) {
    throw new AppError('Failed to generate presigned URL', 500);
  }
};

