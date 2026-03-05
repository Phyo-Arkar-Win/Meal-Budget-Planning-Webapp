// src/routes/exercise.routes.ts
import { Router } from 'express';
import {
  getExercises,
  getExerciseById,
  calculateExerciseBurn,
  seedExercises,
} from '../controllers/exercise.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// IMPORTANT: /seed must be BEFORE /:exerciseId
// otherwise Express treats "seed" as an exerciseId param
router.post('/seed',                       protect, seedExercises);
router.post('/:exerciseId/calculate-burn',          calculateExerciseBurn);
router.get('/',                                     getExercises);
router.get('/:exerciseId',                          getExerciseById);

export default router;