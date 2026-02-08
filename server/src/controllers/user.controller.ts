import { Request, Response } from 'express';
import User from '../models/User';
import { calculateSpecificMacros } from '../utils/nutrition';

interface AuthRequest extends Request {
  user?: { id: string };
}

export const updateMacroTargets = async (req: AuthRequest, res: Response) => {
  try {
    const { weight, height, age, gender, activity_level, fitness_goal } = req.body;

    // Validate required fields for calculation
    if (!weight || !height || !age || !gender) {
      return res.status(400).json({ message: "weight, height, age, and gender are required" });
    }

    // Create a temporary user object for calculation (no database lookup needed)
    const tempUser = {
      weight: Number(weight),
      height: Number(height),
      age: Number(age),
      gender: gender as 'male' | 'female',
    } as any;

    const { protein_target, fat_target, sugar_target, bmr, tdee} = calculateSpecificMacros(tempUser, { activity_level, fitness_goal });

    // If userId is provided, update and save the user document
    const userId = req.body.userId || req.user?.id;
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        if (weight) user.weight = weight;
        if (height) user.height = height;
        if (age) user.age = age;
        user.macro_targets.protein = protein_target;
        user.macro_targets.fat = fat_target;
        user.macro_targets.sugar = sugar_target;
        await user.save();
      }
    }

    return res.status(200).json({
      message: "Macros calculated",
      data: {
        bmr,
        tdee,
        protein: protein_target,
        fat: fat_target,
        sugar: sugar_target
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error calculating macros" });
  }
};