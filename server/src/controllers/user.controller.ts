import { Request, Response } from 'express';
import User from '../models/User';
import { calculateSpecificMacros } from '../utils/nutrition';

interface AuthRequest extends Request {
  user?: { id: string };
}

export const updateMacroTargets = async (req: AuthRequest, res: Response) => {
  try {
    const { activity_level, fitness_goal } = req.body;

    let userSource: any; // can be Mongoose user or plain object

    // Authenticated request → use DB
    if (req.user?.id) {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      userSource = user;
    } 
    // Public request → use body
    else {
      const { weight, height, age, gender } = req.body;

      if (!weight || !height || !age || !gender) {
        return res.status(400).json({
          message: "weight, height, age, and gender are required for public requests"
        });
      }

      userSource = {
        weight: Number(weight),
        height: Number(height),
        age: Number(age),
        gender: gender as 'male' | 'female',
        fitness_goal
      };
    }

    // Calculate macros
    const {
      protein_target,
      fat_target,
      sugar_target,
      bmr,
      tdee
    } = calculateSpecificMacros(userSource, { activity_level, fitness_goal });

    // Save only for authenticated users
    if (req.user?.id) {
      userSource.macro_targets.protein = protein_target;
      userSource.macro_targets.fat = fat_target;
      userSource.macro_targets.sugar = sugar_target;
      await userSource.save();
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