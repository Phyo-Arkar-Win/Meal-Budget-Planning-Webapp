import { Router } from "express";
import { updateMacroTargets } from "../controllers/user.controller";
import { protect } from '../middleware/auth.middleware';

const router = Router();


router.post("/calculate", protect, updateMacroTargets);

export default router;