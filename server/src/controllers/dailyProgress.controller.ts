// src/controllers/dailyProgress.controller.ts
import { Request, Response } from 'express';
import DailyProgress from '../models/DailyProgress';
import Plan from '../models/Plan';
import '../models/Food';

// Helper function to get User ID for testing
const getUserId = (req: Request) => {
  return (req as any).user?.id || req.headers['user-id'];
};

// @desc    Get today's tracking record (or create a new one if it's a new day)
// @route   GET /api/progress/:planId/today
export const getTodayProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized." });
      return;
    }

    // 1. Verify the plan exists and belongs to the user
    const plan = await Plan.findOne({ _id: planId, owner: userId });
    if (!plan) {
      res.status(404).json({ message: "Plan not found." });
      return;
    }

    // 2. Figure out the start and end of "today" in the database
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // 3. Look for an existing progress record for today
    let progress = await DailyProgress.findOne({
      plan_id: planId,
      user_id: userId,
      date: { $gte: todayStart, $lt: todayEnd }
    }).populate('eaten_template_menus');

    // 4. If they haven't started tracking today, create a new blank record!
    if (!progress) {
      // Calculate what day number this is (e.g., Day 1, Day 2)
      const previousDaysCount = await DailyProgress.countDocuments({ plan_id: planId });
      
      progress = new DailyProgress({
        plan_id: planId,
        user_id: userId,
        day_number: previousDaysCount + 1,
        date: new Date(), // Right now
        eaten_template_menus: [],
        excess_daily_foods: [],
        status: 'tracking'
      });

      await progress.save();
    }

    res.status(200).json(progress);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update tracking (tick off planned meals or add excess foods)
// @route   PUT /api/progress/:progressId/track
export const updateTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { progressId } = req.params;
    const { eaten_template_menus, excess_daily_foods } = req.body;
    const userId = getUserId(req);

    // Find the current tracking document
    const progress = await DailyProgress.findOne({ _id: progressId, user_id: userId });

    if (!progress) {
      res.status(404).json({ message: "Daily progress record not found." });
      return;
    }

    // Prevent editing if they already hit "Save Progress" for the day
    if (progress.status === 'saved') {
      res.status(400).json({ message: "Cannot edit tracking after progress has been saved for the day." });
      return;
    }

    // Update the arrays
    if (eaten_template_menus) progress.eaten_template_menus = eaten_template_menus;
    if (excess_daily_foods) progress.excess_daily_foods = excess_daily_foods;

    const updatedProgress = await progress.save();

    res.status(200).json(updatedProgress);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Calculate totals and move to Recommendation State
// @route   PUT /api/progress/:progressId/complete
export const completeTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { progressId } = req.params;
    const userId = getUserId(req);

    // 1. Find progress AND populate the template menus so we can read their prices/macros
    const progress = await DailyProgress.findOne({ _id: progressId, user_id: userId })
      .populate('eaten_template_menus');

    if (!progress) {
      res.status(404).json({ message: "Daily progress record not found." });
      return;
    }

    if (progress.status === 'saved') {
      res.status(400).json({ message: "This day is already saved and finalized." });
      return;
    }

    // 2. Find the parent plan to get the targets
    const plan = await Plan.findById(progress.plan_id);
    if (!plan) {
      res.status(404).json({ message: "Parent plan not found." });
      return;
    }

    // 3. Calculate Totals
    let totalCalories = 0;
    let totalPrice = 0;

    // Add up foods from the template
    // (We use 'any' here temporarily because populated fields lose strict typing in basic Mongoose setups)
    progress.eaten_template_menus.forEach((food: any) => {
      totalCalories += food.macros?.calories || 0;
      totalPrice += food.price || 0;
    });

    // Add up manually entered ad-hoc foods
    progress.excess_daily_foods.forEach((food) => {
      totalCalories += food.calories || 0;
      totalPrice += food.price || 0;
    });

    // 4. Calculate Exceedances
    const calTarget = plan.macro_targets.daily_cal;
    let caloriesExceeded = totalCalories - calTarget;
    if (caloriesExceeded < 0) caloriesExceeded = 0; // Don't show negative exceedance

    let budgetExceeded = 0;
    if (plan.priority === 'budget' && plan.budget_limit !== null) {
      budgetExceeded = totalPrice - plan.budget_limit;
      if (budgetExceeded < 0) budgetExceeded = 0;
    }

    // 5. Update State
    progress.status = 'recommendation';
    progress.recommendation_data.calories_exceeded = caloriesExceeded;
    progress.recommendation_data.budget_exceeded = budgetExceeded;

    const savedProgress = await progress.save();

    res.status(200).json({
      message: "Daily tracking completed. Ready for review.",
      summary: { totalCalories, totalPrice, calTarget, budgetLimit: plan.budget_limit },
      data: savedProgress
    });

  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Finalize the day and save exercise progress
// @route   PUT /api/progress/:progressId/save
export const saveProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { progressId } = req.params;
    const { exercise_selected, exercise_time_minutes, actually_exercised } = req.body;
    const userId = getUserId(req);

    const progress = await DailyProgress.findOne({ _id: progressId, user_id: userId });

    if (!progress) {
      res.status(404).json({ message: "Daily progress record not found." });
      return;
    }

    if (progress.status !== 'recommendation') {
      res.status(400).json({ message: "You must complete tracking before saving progress." });
      return;
    }

    // Update with exercise decisions
    progress.status = 'saved';
    if (exercise_selected) progress.recommendation_data.exercise_selected = exercise_selected;
    if (exercise_time_minutes) progress.recommendation_data.exercise_time_minutes = exercise_time_minutes;
    if (actually_exercised !== undefined) progress.recommendation_data.actually_exercised = actually_exercised;

    const savedProgress = await progress.save();

    res.status(200).json({
      message: "Day finalized and saved successfully!",
      data: savedProgress
    });

  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all saved progress days for a plan (for frontend charts)
// @route   GET /api/progress/:planId/stats
export const getPlanStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;
    const userId = getUserId(req);

    // Find all SAVED days for this specific plan, sorted by day_number (1, 2, 3...)
    const history = await DailyProgress.find({ 
      plan_id: planId, 
      user_id: userId,
      status: 'saved' 
    }).sort({ day_number: 1 });

    // Format the data perfectly for frontend charting libraries (like Recharts or Chart.js)
    const chartData = history.map(day => ({
      day_number: day.day_number,
      date: day.date,
      calories_exceeded: day.recommendation_data?.calories_exceeded || 0,
      budget_exceeded: day.recommendation_data?.budget_exceeded || 0,
      exercised: day.recommendation_data?.actually_exercised || false
    }));

    res.status(200).json({
      message: "Stats retrieved successfully",
      total_days_tracked: chartData.length,
      data: chartData
    });

  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};