// src/routes/exercise.routes.ts
import { Router } from 'express';
import { getExercises, seedExercises } from '../controllers/exercise.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Notice I didn't put 'protect' on the GET route. 
// Usually, you want anyone (even logged-out users exploring the app) to be able to see the exercise list!
router.get('/', getExercises);

// But we DO want to protect the seed route so random people can't mess with your database.
router.post('/seed', protect, seedExercises);

export default router;