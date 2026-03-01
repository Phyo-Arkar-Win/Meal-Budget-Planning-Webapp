import { Request, Response } from "express";
import bcrypt from "bcrypt"; // ← ADD THIS IMPORT
import User from "../models/User";
import { calculateSpecificMacros } from "../utils/nutrition";
import { v2 as cloudinary } from 'cloudinary';

interface AuthRequest extends Request {
  user?: { id: string };
}

export const updateMacroTargets = async (req: AuthRequest, res: Response) => {
  try {
    const { activity_level, fitness_goal } = req.body;

    let userSource: any;

    if (req.user?.id) {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      userSource = user;
    } else {
      const { weight, height, age, gender } = req.body;
      if (!weight || !height || !age || !gender) {
        return res.status(400).json({
          message: "weight, height, age, and gender are required for public requests",
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

    const {
      protein_target, fat_target, sugar_target, carb_target,
      bmr, tdee, totalDailyCalories,
    } = calculateSpecificMacros(userSource, { activity_level, fitness_goal });

    if (req.user?.id) {
      userSource.macro_targets.daily_cal    = totalDailyCalories;
      userSource.macro_targets.carbohydrate = carb_target;
      userSource.macro_targets.protein      = protein_target;
      userSource.macro_targets.fat          = fat_target;
      userSource.macro_targets.sugar        = sugar_target;
      if (fitness_goal)   userSource.fitness_goal   = fitness_goal;
      if (activity_level) userSource.activity_level = activity_level;
      await userSource.save();
    }

    return res.status(200).json({
      message: "Macros calculated",
      data: { bmr, tdee, daily_cal: totalDailyCalories, carbohydrate: carb_target, protein: protein_target, fat: fat_target, sugar: sugar_target },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error calculating macros" });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      message: "Profile fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error fetching profile" });
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    // Fetch WITH password this time so we can update it if needed
    const user = await User.findById(req.user?.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Profile picture upload
    if (req.file) {
      if (user.profile_picture) {
        try {
          const urlParts            = user.profile_picture.split('/');
          const filenameWithExt     = urlParts.pop();
          const folderName          = urlParts.pop();
          if (filenameWithExt && folderName) {
            const filename = filenameWithExt.split('.')[0];
            await cloudinary.uploader.destroy(`${folderName}/${filename}`);
          }
        } catch (cloudinaryError) {
          console.error("Failed to delete old image:", cloudinaryError);
        }
      }
      user.profile_picture = req.file.path;
    }

    // Standard profile fields
    const { username, age, weight, height, fitness_goal, activity_level, gender } = req.body;

    if (username)       user.username       = username;
    if (age)            user.age            = age;
    if (weight)         user.weight         = weight;
    if (height)         user.height         = height;
    if (fitness_goal)   user.fitness_goal   = fitness_goal;
    if (activity_level) user.activity_level = activity_level;
    if (gender)         user.gender         = gender;

    // Password update (used by /complete-profile for new Google users)
    // Only hashes and saves if a plain-text password is sent in the request body
    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    await user.save();

    // Return user without exposing the password field
    const userObj = user.toObject() as any;
    delete userObj.password;

    return res.status(200).json({
      message: "Profile updated successfully",
      data: userObj,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error updating profile" });
  }
};