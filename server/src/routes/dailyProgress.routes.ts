// server/src/routes/dailyProgress.routes.ts
import { Router } from 'express';
import {
  getTodayProgress,
  getTodayStatus,
  getProgressById,
  updateTracking,
  completeTracking,
  saveProgress,
  getPlanStats,
} from '../controllers/dailyProgress.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/entry/:progressId',    getProgressById);   
router.get('/:planId/today',        getTodayProgress);
router.get('/:planId/today-status', getTodayStatus);    
router.get('/:planId/stats',        getPlanStats);
router.put('/:progressId/track',    updateTracking);
router.put('/:progressId/complete', completeTracking);
router.put('/:progressId/save',     saveProgress);

export default router;