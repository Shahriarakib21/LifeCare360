import { Request, Response, NextFunction } from 'express';
import { register, login } from '../auth.controller';
import User from '../../models/mongodb/User.model';
import Patient from '../../models/mongodb/Patient.model';
import { AppError } from '../../middleware/errorHandler';

// Mock models
jest.mock('../../models/mongodb/User.model');
jest.mock('../../models/mongodb/Patient.model');

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
        role: 'patient',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
      };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'patient',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        save: jest.fn(),
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (Patient.create as jest.Mock).mockResolvedValue({});

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User registered successfully',
        })
      );
    });

    it('should return error if user already exists', async () => {
      mockRequest.body = {
        email: 'existing@example.com',
        password: 'password123',
        role: 'patient',
        firstName: 'John',
        lastName: 'Doe',
      };

      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'existing' });

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(AppError)
      );
    });

    it('should return error if required fields are missing', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        // Missing password, firstName, lastName
      };

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(AppError)
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'patient',
        profile: {},
        mfaEnabled: false,
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
        })
      );
    });

    it('should return error for invalid credentials', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(AppError)
      );
    });

    it('should require MFA code if MFA is enabled', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
        // Missing mfaCode
      };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'patient',
        mfaEnabled: true,
        mfaSecret: 'secret',
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(AppError)
      );
    });
  });
});

