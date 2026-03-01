import { Request, Response } from "express";
import User from "../models/User";
import { calculateSpecificMacros } from "../utils/nutrition";
import { v2 as cloudinary } from 'cloudinary';

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
          message:
            "weight, height, age, and gender are required for public requests",
        });
      }

      userSource = {
        weight: Number(weight),
        height: Number(height),
        age: Number(age),
        gender: gender as "male" | "female",
        activity_level: activity_level || "Sedentary",
        fitness_goal: fitness_goal || "Maintenance",
      };
    }

    // Calculate macros
    const {
      protein_target,
      fat_target,
      sugar_target,
      carb_target,
      bmr,
      tdee,
      totalDailyCalories,
    } = calculateSpecificMacros(userSource, { activity_level, fitness_goal });

    // Save only for authenticated users
    if (req.user?.id) {
      userSource.macro_targets.daily_cal = totalDailyCalories;
      userSource.macro_targets.carbohydrate = carb_target;
      userSource.macro_targets.protein = protein_target;
      userSource.macro_targets.fat = fat_target;
      userSource.macro_targets.sugar = sugar_target;

      if (fitness_goal) userSource.fitness_goal = fitness_goal;
      if (activity_level) userSource.activity_level = activity_level;
      await userSource.save();
    }

    return res.status(200).json({
      message: "Macros calculated",
      data: {
        bmr,
        tdee,
        daily_cal: totalDailyCalories,
        carbohydrate: carb_target,
        protein: protein_target,
        fat: fat_target,
        sugar: sugar_target,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error calculating macros" });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    // Find user by ID attached by auth middleware
    const user = await User.findById(req.user?.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile fetched successfully",
      data: user
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error fetching profile" });
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.file) {
      if (user.profile_picture) {
        try {
          const urlParts = user.profile_picture.split('/');
          const filenameWithExtension = urlParts.pop(); 
          const folderName = urlParts.pop(); 
          if (filenameWithExtension && folderName) {
            const filename = filenameWithExtension.split('.')[0]; 
            const publicId = `${folderName}/${filename}`; 

            await cloudinary.uploader.destroy(publicId);
            console.log(`Deleted old image: ${publicId}`);
          }
        } catch (cloudinaryError) {
          console.error("Failed to delete old image :", cloudinaryError);
        }
      }

        user.profile_picture = req.file.path;
    }

    // Extract allowed fields to update from the request body
    const { username, age, weight, height, fitness_goal, activity_level } = req.body;

    // Update fields if they are provided
    if (username) user.username = username;
    if (age) user.age = age;
    if (weight) user.weight = weight;
    if (height) user.height = height;
    if (fitness_goal) user.fitness_goal = fitness_goal;

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      data: user
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error updating profile" });
 }
};