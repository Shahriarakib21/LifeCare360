import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import User from '../models/mongodb/User.model';
import LoginLog from '../models/mongodb/LoginLog.model';
import Patient from '../models/mongodb/Patient.model';
import Doctor from '../models/postgres/Doctor.model';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Generate JWT token
const generateToken = (id: string, email: string, role: string): string => {
  return (jwt.sign as any)({ id, email, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

// Register new user
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, role, firstName, lastName, phone } = req.body;

    // Validate input
    if (!email || !password || !role || !firstName || !lastName) {
      throw new AppError('Missing required fields', 400);
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    // Create user
    const user = await User.create({
      email,
      password,
      role,
      profile: {
        firstName,
        lastName,
        phone,
      },
    });

    // Create patient profile if role is patient
    if (role === 'patient') {
      await Patient.create({
        userId: user._id,
        emergencyContacts: [],
        preferences: {
          diet: { type: 'none' },
          language: 'en',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        },
        consentSettings: {
          shareWithDoctors: true,
          shareWithLabs: true,
          shareWithPharmacies: false,
          shareWithInsurance: false,
          shareWithHospitals: true,
        },
      });
    }

    // Create doctor profile if role is doctor
    if (role === 'doctor') {
      try {
        // Check if PostgreSQL is available (with timeout)
        const { sequelize } = await import('../config/database');

        // Use Promise.race to timeout the connection check after 1 second
        const connectionCheck = Promise.race([
          sequelize.authenticate(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 1000))
        ]);

        await connectionCheck;

        // Create a basic doctor profile
        // Doctor will need to complete their profile later
        await Doctor.create({
          userId: user._id.toString(),
          specialization: 'General Medicine', // Default, can be updated later
          qualifications: [],
          experience: 0,
          licenseNumber: `TEMP-${Date.now()}`, // Temporary, should be updated
          licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'US',
          },
          contact: {
            phone: phone || '',
            email: email,
          },
          availability: {
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            hours: {
              start: '09:00',
              end: '17:00',
            },
            timezone: 'America/New_York',
          },
          consultationFee: 100.00,
          languages: ['English'],
          isVerified: false, // Will need to be verified by admin
          isActive: true,
        });

        logger.info(`Doctor profile created for user: ${email}`);
      } catch (dbError: any) {
        // PostgreSQL not available - log warning but don't fail registration
        logger.warn(`Could not create doctor profile (PostgreSQL not available): ${dbError.message}`);
      }
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.email, user.role);

    logger.info(`New user registered: ${email} (${role})`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, mfaCode } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // Find user and include password
    console.log(`[DEBUG] Login attempt for: ${email}`);
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`[DEBUG] User not found: ${email}`);
      throw new AppError('Invalid credentials', 401);
    }
    console.log(`[DEBUG] User found, checking password...`);

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log(`[DEBUG] Password mismatch for: ${email}`);
      console.log(`[DEBUG] Provided: ${password}, Stored hash: ${user.password}`);
      throw new AppError('Invalid credentials', 401);
    }
    console.log(`[DEBUG] Password matched.`);

    // Verify MFA if enabled
    if (user.mfaEnabled) {
      if (!mfaCode) {
        throw new AppError('MFA code required', 401);
      }

      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret || '',
        encoding: 'base32',
        token: mfaCode,
        window: 2,
      });

      if (!verified) {
        throw new AppError('Invalid MFA code', 401);
      }
    }

    // Check if user is active
    if (user.isActive === false) {
      throw new AppError('Your account has been deactivated. Please contact support.', 403);
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.email, user.role);

    // Log login
    try {
      await LoginLog.create({
        userId: user._id,
        email: user.email,
        role: user.role,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (logError) {
      console.error('Failed to log login:', logError);
    }

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          mfaEnabled: user.mfaEnabled,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Enable MFA
export const enableMFA = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.mfaEnabled) {
      throw new AppError('MFA already enabled', 400);
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `HealthLife (${user.email})`,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Save secret (temporarily, until verified)
    user.mfaSecret = secret.base32 || '';
    await user.save();

    res.json({
      success: true,
      message: 'MFA setup initiated',
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify MFA and enable
export const verifyMFA = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, mfaCode } = req.body;

    if (!email || !mfaCode) {
      throw new AppError('Email and MFA code are required', 400);
    }

    const user = await User.findOne({ email }).select('+mfaSecret');
    if (!user || !user.mfaSecret) {
      throw new AppError('MFA not set up', 400);
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: mfaCode,
      window: 2,
    });

    if (!verified) {
      throw new AppError('Invalid MFA code', 401);
    }

    user.mfaEnabled = true;
    await user.save();

    res.json({
      success: true,
      message: 'MFA enabled successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Request password reset
export const requestPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists for security
      res.json({
        success: true,
        message: 'If email exists, password reset link has been sent',
      });
      return;
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user._id.toString() },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // TODO: Send email with reset link
    logger.info(`Password reset requested for: ${email}`);

    res.json({
      success: true,
      message: 'If email exists, password reset link has been sent',
    });
  } catch (error) {
    next(error);
  }
};

// Reset password
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new AppError('Token and new password are required', 400);
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id).select('+password');

    if (!user) {
      throw new AppError('Invalid or expired token', 400);
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Verify email
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new AppError('Verification token is required', 400);
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new AppError('Invalid token', 400);
    }

    user.isEmailVerified = true;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new AppError('Token is required', 400);
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
    };

    const user = await User.findById(decoded.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const newToken = generateToken(user._id.toString(), user.email, user.role);

    res.json({
      success: true,
      data: {
        token: newToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

