import { body, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

// Validation middleware
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((err) => err.msg);
      return next(new AppError(errorMessages.join(', '), 400));
    }

    next();
  };
};

// Common validation rules
export const registerValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('role')
    .isIn(['patient', 'doctor', 'pharmacy', 'lab', 'hospital', 'insurance'])
    .withMessage('Invalid role'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const prescriptionValidation = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('medication').notEmpty().withMessage('Medication is required'),
  body('dosage').notEmpty().withMessage('Dosage is required'),
  body('frequency').notEmpty().withMessage('Frequency is required'),
  body('duration').notEmpty().withMessage('Duration is required'),
];

export const appointmentValidation = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:mm)'),
  body('type').isIn(['in-person', 'video', 'phone']).withMessage('Invalid appointment type'),
];

export const ehrValidation = [
  body('type')
    .isIn(['vital', 'lab', 'diagnosis', 'prescription', 'procedure', 'vaccination', 'allergy', 'note'])
    .withMessage('Invalid EHR type'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('data').notEmpty().withMessage('Data is required'),
];

