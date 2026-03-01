// src/controllers/plan.controller.ts
import { Request, Response } from 'express';
import Plan from '../models/Plan';
import User from '../models/User';

// Helper function to get User ID for testing until Auth is ready
const getUserId = (req: Request) => {
  // Try to get from auth middleware first, fallback to header for Postman testing
  return (req as any).user?.id || req.headers['user-id'];
};

// @desc    Create a new plan
// @route   POST /api/plans
export const createPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fitness_goal, activity_level, priority, budget_limit, duration, template_menus } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized. Please provide 'user-id' in headers for testing." });
      return;
    }

    const user = await User.findById(userId);
    if (!user || !user.macro_targets) {
      res.status(400).json({ message: "User macro targets not set. Please update profile first." });
      return;
    }

    if (priority === 'budget' && (budget_limit === undefined || budget_limit === null)) {
      res.status(400).json({ message: "Budget limit is required when priority is budget." });
      return;
    }

    const newPlan = new Plan({
      owner: userId,
      fitness_goal,
      activity_level,
      priority,
      budget_limit: priority === 'nutrient' ? null : budget_limit,
      duration,
      template_menus,
      macro_targets: user.macro_targets 
    });

    const savedPlan = await newPlan.save();
    res.status(201).json(savedPlan);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all plans for a user
// @route   GET /api/plans
export const getUserPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ message: "Unauthorized." });
      return;
    }

    // .populate() replaces the Food IDs with the actual Food objects!
    const plans = await Plan.find({ owner: userId }).populate('template_menus');
    res.status(200).json(plans);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Add a meal to the plan template
// @route   PUT /api/plans/:id/meals
export const addMealToPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { foodId } = req.body; // The ID of the food from your Food database
    const planId = req.params.id;

    // Use $addToSet to prevent adding the exact same food ID twice if you don't want duplicates
    // If you DO want duplicates (e.g., eating the same menu twice a day), use $push instead.
    const updatedPlan = await Plan.findByIdAndUpdate(
      planId,
      { $push: { template_menus: foodId } }, 
      { new: true }
    ).populate('template_menus');

    if (!updatedPlan) {
      res.status(404).json({ message: "Plan not found" });
      return;
    }

    res.status(200).json(updatedPlan);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Remove a meal from the plan template
// @route   DELETE /api/plans/:id/meals/:foodId
export const removeMealFromPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, foodId } = req.params;

    // $pull removes the specific food ID from the array
    const updatedPlan = await Plan.findByIdAndUpdate(
      id,
      { $pull: { template_menus: foodId } },
      { new: true }
    ).populate('template_menus');

    if (!updatedPlan) {
      res.status(404).json({ message: "Plan not found" });
      return;
    }

    res.status(200).json(updatedPlan);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};