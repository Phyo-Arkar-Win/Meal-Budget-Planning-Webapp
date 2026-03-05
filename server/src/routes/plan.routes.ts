// server/src/routes/plan.routes.ts
import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  createPlan,
  getUserPlans,
  getPlanById,
  deletePlan,
  previewMacros,
  addMealToPlan,
  removeMealFromPlan,
  extendPlan,
} from "../controllers/plan.controller";

const router = Router();

router.post("/preview-macros",          protect, previewMacros);
router.get("/",                          protect, getUserPlans);
router.post("/",                         protect, createPlan);
router.get("/:planId",                   protect, getPlanById);
router.delete("/:planId",                protect, deletePlan);
router.put("/:planId/extend",            protect, extendPlan);        
router.post("/:planId/meals",            protect, addMealToPlan);
router.delete("/:planId/meals/:foodId",  protect, removeMealFromPlan);

export default router;