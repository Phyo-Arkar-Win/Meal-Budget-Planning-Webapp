import { Router } from "express";
import { 
  createPlan, 
  getUserPlans, 
  addMealToPlan, 
  removeMealFromPlan 
} from "../controllers/plan.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);

router.post("/", createPlan);
router.get("/", getUserPlans);

router.post("/:planId/meals", addMealToPlan);
router.delete("/:planId/meals/:foodId", removeMealFromPlan);

export default router;