import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { uploadFood } from "../middleware/upload.middleware";
import { createFood, getFoods, getFoodById, seedFoods } from "../controllers/food.controller";

const router = Router();

router.post("/seed", seedFoods);

router.get("/",    protect, getFoods);
router.get("/:id", protect, getFoodById);
router.post("/",   protect, uploadFood.single("picture"), createFood);

export default router;