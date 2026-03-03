// server/src/controllers/dailyProgress.controller.ts
import { Request, Response } from 'express';
import DailyProgress from '../models/DailyProgress';
import Plan from '../models/Plan';
import '../models/Food';

interface AuthRequest extends Request {
  user?: { id: string };
}

// @desc    Get today's tracking record (or create a new one if it's a new day)
// @route   GET /api/progress/:planId/today
export const getTodayProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;
    const userId = req.user?.id; // ← fixed: use protect middleware, not testing helper

    if (!userId) { res.status(401).json({ message: "Unauthorized." }); return; }

    const plan = await Plan.findOne({ _id: planId, owner: userId });
    if (!plan) { res.status(404).json({ message: "Plan not found." }); return; }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    let progress = await DailyProgress.findOne({
      plan_id: planId,
      user_id: userId,
      date: { $gte: todayStart, $lt: todayEnd }
    }).populate('eaten_template_menus');

    if (!progress) {
      const previousDaysCount = await DailyProgress.countDocuments({ plan_id: planId });
      progress = new DailyProgress({
        plan_id:               planId,
        user_id:               userId,
        day_number:            previousDaysCount + 1,
        date:                  new Date(),
        eaten_template_menus:  [],
        excess_daily_foods:    [],
        status:                'tracking',
      });
      await progress.save();
    }

    res.status(200).json(progress);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update tracking (tick planned meals / add excess foods)
// @route   PUT /api/progress/:progressId/track
export const updateTracking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { progressId } = req.params;
    const { eaten_template_menus, excess_daily_foods } = req.body;
    const userId = req.user?.id;

    const progress = await DailyProgress.findOne({ _id: progressId, user_id: userId });
    if (!progress) { res.status(404).json({ message: "Daily progress record not found." }); return; }

    if (progress.status === 'saved') {
      res.status(400).json({ message: "Cannot edit tracking after progress has been saved." });
      return;
    }

    if (eaten_template_menus !== undefined) progress.eaten_template_menus = eaten_template_menus;
    if (excess_daily_foods   !== undefined) progress.excess_daily_foods   = excess_daily_foods;

    const updated = await progress.save();
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Calculate totals and move to Recommendation state
// @route   PUT /api/progress/:progressId/complete
export const completeTracking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { progressId } = req.params;
    const userId = req.user?.id;

    const progress = await DailyProgress.findOne({ _id: progressId, user_id: userId })
      .populate('eaten_template_menus');

    if (!progress) { res.status(404).json({ message: "Daily progress record not found." }); return; }
    if (progress.status === 'saved') {
      res.status(400).json({ message: "This day is already saved and finalized." }); return;
    }

    const plan = await Plan.findById(progress.plan_id);
    if (!plan) { res.status(404).json({ message: "Parent plan not found." }); return; }

    let totalCalories = 0;
    let totalPrice    = 0;

    progress.eaten_template_menus.forEach((food: any) => {
      totalCalories += food.macros?.calories || 0;
      totalPrice    += food.price || 0;
    });

    progress.excess_daily_foods.forEach((food) => {
      totalCalories += food.calories || 0;
      totalPrice    += food.price    || 0;
    });

    const calTarget        = plan.macro_targets.daily_cal;
    const caloriesExceeded = Math.max(0, totalCalories - calTarget);

    let budgetExceeded = 0;
    if (plan.priority === 'budget' && plan.budget_limit !== null) {
      budgetExceeded = Math.max(0, totalPrice - plan.budget_limit);
    }

    progress.status = 'recommendation';
    progress.recommendation_data.calories_exceeded = caloriesExceeded;
    progress.recommendation_data.budget_exceeded   = budgetExceeded;

    const saved = await progress.save();

    res.status(200).json({
      message: "Daily tracking completed. Ready for review.",
      summary: { totalCalories, totalPrice, calTarget, budgetLimit: plan.budget_limit },
      data:    saved,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Finalize the day and save exercise progress
// @route   PUT /api/progress/:progressId/save
export const saveProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { progressId } = req.params;
    const { exercise_selected, exercise_time_minutes, actually_exercised } = req.body;
    const userId = req.user?.id;

    const progress = await DailyProgress.findOne({ _id: progressId, user_id: userId });
    if (!progress) { res.status(404).json({ message: "Daily progress record not found." }); return; }

    if (progress.status !== 'recommendation') {
      res.status(400).json({ message: "You must complete tracking before saving progress." }); return;
    }

    progress.status = 'saved';
    if (exercise_selected)        progress.recommendation_data.exercise_selected    = exercise_selected;
    if (exercise_time_minutes)    progress.recommendation_data.exercise_time_minutes = exercise_time_minutes;
    if (actually_exercised !== undefined) progress.recommendation_data.actually_exercised = actually_exercised;

    const saved = await progress.save();
    res.status(200).json({ message: "Day finalized and saved!", data: saved });
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all saved progress days for a plan (for charts)
// @route   GET /api/progress/:planId/stats
export const getPlanStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;
    const userId = req.user?.id;

    const history = await DailyProgress.find({
      plan_id: planId,
      user_id: userId,
      status:  'saved',
    }).sort({ day_number: 1 });

    const chartData = history.map(day => ({
      day_number:         day.day_number,
      date:               day.date,
      calories_exceeded:  day.recommendation_data?.calories_exceeded  || 0,
      budget_exceeded:    day.recommendation_data?.budget_exceeded    || 0,
      exercised:          day.recommendation_data?.actually_exercised || false,
    }));

    res.status(200).json({
      message:            "Stats retrieved successfully",
      total_days_tracked: chartData.length,
      data:               chartData,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};