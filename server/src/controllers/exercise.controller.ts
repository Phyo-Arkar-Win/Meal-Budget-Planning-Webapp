// src/controllers/exercise.controller.ts
import { Request, Response } from 'express';
import Exercise from '../models/Exercise';

// @desc    Get all exercises
// @route   GET /api/exercises
export const getExercises = async (req: Request, res: Response): Promise<void> => {
  try {
    const exercises = await Exercise.find({});
    res.status(200).json(exercises);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Seed default exercises (Run this ONCE in Postman)
// @route   POST /api/exercises/seed
export const seedExercises = async (req: Request, res: Response): Promise<void> => {
  try {
    // Adjusted to match your cal_per_hour schema!
    const defaultExercises = [
      { name: 'Running (Moderate)', cal_per_hour: 600 },
      { name: 'Walking (Brisk)', cal_per_hour: 300 },
      { name: 'Cycling', cal_per_hour: 480 },
      { name: 'Swimming', cal_per_hour: 660 },
      { name: 'Weightlifting', cal_per_hour: 360 }
    ];

    // We use findOneAndUpdate with upsert so it safely updates or creates,
    // preventing the "duplicate key" error from your unique: true rule!
    for (const ex of defaultExercises) {
      await Exercise.findOneAndUpdate(
        { name: ex.name }, 
        { cal_per_hour: ex.cal_per_hour }, 
        { upsert: true, new: true }
      );
    }

    const allExercises = await Exercise.find({});
    res.status(201).json({ message: "Exercises seeded successfully!", data: allExercises });
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};