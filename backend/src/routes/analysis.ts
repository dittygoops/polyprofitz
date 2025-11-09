import { Router } from 'express';
import { AnalysisController } from '../controllers/analysisController';
import { validate, analyzeQuerySchema } from '../middleware/validator';

const router = Router();
const analysisController = new AnalysisController();

// POST /api/analyze
router.post('/analyze', validate(analyzeQuerySchema), analysisController.analyze);

export default router;
