import { Router } from "express";
import { addReview, getFoodReviews } from "../controllers/review.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.get("/:foodId", getFoodReviews);
router.post("/:foodId", protect, addReview);

export default router;