import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { createFood, getFoods, getFoodById } from "../controllers/food.controller";

const router = Router();

router.get("/",    protect, getFoods);      // GET  /api/foods
router.get("/:id", protect, getFoodById);   // GET  /api/foods/:id
router.post("/",   protect, createFood);    // POST /api/foods

export default router;