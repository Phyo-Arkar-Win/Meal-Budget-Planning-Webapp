import { Request, Response } from 'express';
import User from '../models/User';
import { calculateSpecificMacros } from '../utils/nutrition';

interface AuthRequest extends Request {
  user?: { id: string };
}

export const updateMacroTargets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.body.userId || req.user?.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { weight, height, age, activity_level, fitness_goal } = req.body;
    if (weight) user.weight = weight;
    if (height) user.height = height;
    if (age) user.age = age;
    if (activity_level) user.activity_level = activity_level;
    if (fitness_goal) user.fitness_goal = fitness_goal;


    const { protein_target, fat_target, sugar_target } = calculateSpecificMacros(user);

    user.protein_target = protein_target;
    user.fat_target = fat_target;
    user.sugar_target = sugar_target;
    

    await user.save();

    return res.status(200).json({
      message: "Protein, Fat, and Sugar targets updated",
      data: {
        protein: user.protein_target,
        fat: user.fat_target,
        sugar: user.sugar_target
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error calculating macros" });
  }
};