// src/routes/dailyProgress.routes.ts
import { Router } from 'express';
import { 
  getTodayProgress, 
  updateTracking, 
  completeTracking, 
  saveProgress,
  getPlanStats
} from '../controllers/dailyProgress.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/:planId/today', getTodayProgress);
router.get('/:planId/stats', getPlanStats);
router.put('/:progressId/track', updateTracking);
router.put('/:progressId/complete', completeTracking); 
router.put('/:progressId/save', saveProgress);       

export default router;