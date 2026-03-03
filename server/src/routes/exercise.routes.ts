// src/routes/exercise.routes.ts
import { Router } from 'express';
import { getExercises, getExerciseById, calculateExerciseBurn, seedExercises } from '../controllers/exercise.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Get all exercises (public)
router.get('/', getExercises);

// Get a specific exercise with calorie calculation
// Usage: GET /api/exercises/:exerciseId?duration_minutes=30&reps=10
router.get('/:exerciseId', getExerciseById);

// Calculate calories burned for an exercise duration (optionally supply reps)
// Usage: POST /api/exercises/:exerciseId/calculate-burn with body { duration_minutes: 30, reps: 12 }
router.post('/:exerciseId/calculate-burn', calculateExerciseBurn);

// Seed default exercises (protected)
router.post('/seed', protect, seedExercises);

export default router;