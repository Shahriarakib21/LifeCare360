import express from 'express';
import {
  analyzeHealthTrends,
  detectAnomalies,
  predictDisease,
  generateNutritionPlan,
  generateExercisePlan,
  chatWithAI,
  checkMedicineConflicts,
} from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate);

router.post('/analyze-trends', analyzeHealthTrends);
router.post('/detect-anomalies', detectAnomalies);
router.post('/predict-disease', predictDisease);
router.post('/nutrition-plan', generateNutritionPlan);
router.post('/exercise-plan', generateExercisePlan);
router.post('/chat', chatWithAI);
router.post('/check-conflicts', checkMedicineConflicts);

export default router;

