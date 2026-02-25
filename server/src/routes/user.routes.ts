import { Router } from "express";
import { updateMacroTargets } from "../controllers/user.controller";
import { protect } from '../middleware/auth.middleware';
import { getUserProfile, updateUserProfile } from "../controllers/user.controller";

const router = Router();


router.post("/calculate", protect, updateMacroTargets);

// Public endpoint for testing without auth (accepts `userId` in body)
router.post("/calculate/public", updateMacroTargets);

router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

export default router;