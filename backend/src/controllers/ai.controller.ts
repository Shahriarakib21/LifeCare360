import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import axios from 'axios';
import { AppError } from '../middleware/errorHandler';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

// Analyze health trends
export const analyzeHealthTrends = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId, metrics, days } = req.body;

    // Call AI engine
    const response = await axios.post(`${AI_ENGINE_URL}/analyze-trends`, {
      patientId,
      metrics,
      days,
    });

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      next(new AppError('AI service unavailable', 503));
    } else {
      next(error);
    }
  }
};

// Detect anomalies
export const detectAnomalies = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId } = req.body;

    const response = await axios.post(`${AI_ENGINE_URL}/detect-anomalies`, {
      patientId,
    });

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      next(new AppError('AI service unavailable', 503));
    } else {
      next(error);
    }
  }
};

// Predict disease
export const predictDisease = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId, symptoms } = req.body;

    const response = await axios.post(`${AI_ENGINE_URL}/predict-disease`, {
      patientId,
      symptoms,
    });

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      next(new AppError('AI service unavailable', 503));
    } else {
      next(error);
    }
  }
};

// Generate nutrition plan
export const generateNutritionPlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId, preferences, goals } = req.body;

    const response = await axios.post(`${AI_ENGINE_URL}/nutrition-plan`, {
      patientId,
      preferences,
      goals,
    });

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      next(new AppError('AI service unavailable', 503));
    } else {
      next(error);
    }
  }
};

// Generate exercise plan
export const generateExercisePlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId, fitnessLevel, goals, restrictions } = req.body;

    const response = await axios.post(`${AI_ENGINE_URL}/exercise-plan`, {
      patientId,
      fitnessLevel,
      goals,
      restrictions,
    });

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      next(new AppError('AI service unavailable', 503));
    } else {
      next(error);
    }
  }
};

// Chat with AI
export const chatWithAI = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { message, patientId, context } = req.body;

    const response = await axios.post(`${AI_ENGINE_URL}/chat`, {
      message,
      patientId,
      context,
    });

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      next(new AppError('AI service unavailable', 503));
    } else {
      next(error);
    }
  }
};

// Check medicine conflicts
export const checkMedicineConflicts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { medicines } = req.body;

    const response = await axios.post(`${AI_ENGINE_URL}/check-conflicts`, {
      medicines,
    });

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      next(new AppError('AI service unavailable', 503));
    } else {
      next(error);
    }
  }
};

