import { Router } from "express";
import { protect } from '../middleware/auth.middleware';
import { createFood, getFoods, getFoodById } from "../controllers/food.controller";

const router = Router();

router.get('/', protect, getFoods)
router.get('/:id', protect, createFood)
router.post('/', protect, getFoodById)

export default router;