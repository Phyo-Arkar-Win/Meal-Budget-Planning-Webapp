// server/src/routes/plan.routes.ts
import { Router } from "express";
import {
  createPlan,
  getUserPlans,
  getPlanById,
  addMealToPlan,
  removeMealFromPlan,
  previewMacros,
} from "../controllers/plan.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);

router.get("/",                         getUserPlans);
router.post("/",                        createPlan);
router.post("/preview-macros",          previewMacros);      
router.get("/:planId",                  getPlanById);         
router.post("/:planId/meals",           addMealToPlan);       
router.delete("/:planId/meals/:foodId", removeMealFromPlan);  

export default router;