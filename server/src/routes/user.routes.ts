import { Router } from "express";
import { updateMacroTargets } from "../controllers/user.controller";
import { protect } from '../middleware/auth.middleware';

const router = Router();


router.post("/calculate", protect, updateMacroTargets);

// Public endpoint for testing without auth (accepts `userId` in body)
router.post("/calculate/public", updateMacroTargets);

export default router;