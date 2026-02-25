import { Router } from "express";
import { generateRecommendation } from "../controllers/recommendation.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router({ mergeParams: true });

router.post("/", protect, generateRecommendation);

export default router;