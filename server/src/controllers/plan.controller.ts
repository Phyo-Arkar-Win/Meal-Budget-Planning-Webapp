// server/src/controllers/plan.controller.ts
import { Request, Response } from 'express';
import Plan from '../models/Plan';
import User from '../models/User';
import { calculateSpecificMacros } from '../utils/nutrition';

interface AuthRequest extends Request {
  user?: { id: string };
}

// @desc    Create a new plan — recalculates macros from the plan's own goal/activity
// @route   POST /api/plans
export const createPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fitness_goal, activity_level, priority, budget_limit, duration, template_menus } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized." });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    if (priority === 'budget' && (budget_limit === undefined || budget_limit === null)) {
      res.status(400).json({ message: "Budget limit is required when priority is budget." });
      return;
    }

    // Recalculate macros using the plan's chosen goal/activity (not the user's profile defaults)
    // This is what makes each plan independent
    const {
      protein_target, fat_target, sugar_target, carb_target, totalDailyCalories
    } = calculateSpecificMacros(user, { activity_level, fitness_goal });

    const newPlan = new Plan({
      owner: userId,
      fitness_goal,
      activity_level,
      priority,
      budget_limit: priority === 'nutrient' ? null : budget_limit,
      duration,
      template_menus: template_menus || [],
      macro_targets: {
        daily_cal:    totalDailyCalories,
        carbohydrate: carb_target,
        protein:      protein_target,
        fat:          fat_target,
        sugar:        sugar_target,
      },
    });

    const savedPlan = await newPlan.save();
    await savedPlan.populate('template_menus');
    res.status(201).json(savedPlan);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all plans for logged-in user
// @route   GET /api/plans
export const getUserPlans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ message: "Unauthorized." }); return; }

    const plans = await Plan.find({ owner: userId }).populate('template_menus').sort({ createdAt: -1 });
    res.status(200).json(plans);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get single plan by ID
// @route   GET /api/plans/:planId
export const getPlanById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const plan = await Plan.findOne({ _id: req.params.planId, owner: userId }).populate('template_menus');
    if (!plan) { res.status(404).json({ message: "Plan not found." }); return; }
    res.status(200).json(plan);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Add a meal to the plan template
// @route   POST /api/plans/:planId/meals   ← fixed: was /:id/meals
export const addMealToPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { foodId } = req.body;
    const { planId } = req.params; // ← fixed: was req.params.id

    const updatedPlan = await Plan.findByIdAndUpdate(
      planId,
      { $push: { template_menus: foodId } },
      { new: true }
    ).populate('template_menus');

    if (!updatedPlan) { res.status(404).json({ message: "Plan not found" }); return; }
    res.status(200).json(updatedPlan);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Remove a meal from the plan template
// @route   DELETE /api/plans/:planId/meals/:foodId  ← fixed: was /:id/meals/:foodId
export const removeMealFromPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { planId, foodId } = req.params; // ← fixed: was req.params.id

    const updatedPlan = await Plan.findByIdAndUpdate(
      planId,
      { $pull: { template_menus: foodId } },
      { new: true }
    ).populate('template_menus');

    if (!updatedPlan) { res.status(404).json({ message: "Plan not found" }); return; }
    res.status(200).json(updatedPlan);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Preview macro recalculation before plan is created
// @route   POST /api/plans/preview-macros
// Used by the frontend to show live macro updates when user changes goal/activity
export const previewMacros = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fitness_goal, activity_level } = req.body;
    const userId = req.user?.id;

    const user = await User.findById(userId);
    if (!user) { res.status(404).json({ message: "User not found." }); return; }

    const {
      protein_target, fat_target, sugar_target, carb_target,
      bmr, tdee, totalDailyCalories
    } = calculateSpecificMacros(user, { activity_level, fitness_goal });

    res.status(200).json({
      daily_cal:    totalDailyCalories,
      carbohydrate: carb_target,
      protein:      protein_target,
      fat:          fat_target,
      sugar:        sugar_target,
      bmr,
      tdee,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};