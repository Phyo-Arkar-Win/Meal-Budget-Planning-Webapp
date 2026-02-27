import { Router } from "express";
import { addReview, getFoodReviews } from "../controllers/review.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router({ mergeParams: true });

router.get("/", getFoodReviews);
router.post("/", protect, addReview);

export default router;