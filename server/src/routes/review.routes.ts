import { Router } from "express";
import { addReview, getFoodReviews } from "../controllers/review.controller";
import { validateReviewInput, validateGetFoodReviewsInput } from "../middleware/review.middleware";
import { protect } from "../middleware/auth.middleware";

const router = Router({ mergeParams: true });

router.get("/", validateGetFoodReviewsInput, getFoodReviews);
router.post("/", protect, validateReviewInput, addReview);

export default router;