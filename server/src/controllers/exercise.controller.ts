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

// @desc    Get exercise by ID, optionally calculate calories burned
// @route   GET /api/exercises/:exerciseId
// @query   ?duration_minutes=30  (optional)
export const getExerciseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { exerciseId }  = req.params;
    const durationMinutes = req.query.duration_minutes
      ? parseInt(req.query.duration_minutes as string)
      : null;
    const repsQuery = req.query.reps
      ? parseInt(req.query.reps as string)
      : null;

    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) { res.status(404).json({ message: "Exercise not found." }); return; }

    if (durationMinutes && durationMinutes > 0) {
      const caloriesBurned = exercise.calculateBurn
        ? exercise.calculateBurn(durationMinutes)
        : Math.round((exercise.cal_per_hour * durationMinutes) / 60);

      const responsePayload: any = {
        ...exercise.toObject(),
        duration_minutes: durationMinutes,
        calories_burned:  caloriesBurned,
      };
      if (repsQuery && repsQuery > 0) responsePayload.reps = repsQuery;

      res.status(200).json(responsePayload);
    } else {
      res.status(200).json(exercise);
    }
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Calculate calories burned for a given duration
// @route   POST /api/exercises/:exerciseId/calculate-burn
// @body    { duration_minutes: number, reps?: number }
export const calculateExerciseBurn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { exerciseId }             = req.params;
    const { duration_minutes, reps } = req.body;

    if (!duration_minutes || duration_minutes <= 0) {
      res.status(400).json({ message: "duration_minutes must be a positive number." });
      return;
    }

    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) { res.status(404).json({ message: "Exercise not found." }); return; }

    const caloriesBurned = exercise.calculateBurn
      ? exercise.calculateBurn(duration_minutes)
      : Math.round((exercise.cal_per_hour * duration_minutes) / 60);

    const payload: any = {
      exercise:         exercise.name,
      cal_per_hour:     exercise.cal_per_hour,
      met:              exercise.met,
      duration_minutes,
      calories_burned:  caloriesBurned,
    };
    if (reps && reps > 0) payload.reps = reps;

    res.status(200).json(payload);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Seed default exercises
// @route   POST /api/exercises/seed
export const seedExercises = async (req: Request, res: Response): Promise<void> => {
  try {
    // YOUR cal_per_hour values kept — friend's values were different so yours take priority
    const defaultExercises = [
      { name: 'Running (Moderate)', cal_per_hour: 600, met: 8,   description: 'Steady pace run' },
      { name: 'Walking (Brisk)',    cal_per_hour: 300, met: 5,   description: 'Fast walk' },
      { name: 'Cycling',           cal_per_hour: 480, met: 7.5, description: 'Moderate cycling' },
      { name: 'Swimming',          cal_per_hour: 660, met: 9,   description: 'Lap swimming' },
      { name: 'Weightlifting',     cal_per_hour: 360, met: 6,   description: 'General weight training', reps: 10 },
    ];

    for (const ex of defaultExercises) {
      await Exercise.findOneAndUpdate(
        { name: ex.name },
        ex,
        { upsert: true, new: true }
      );
    }

    const allExercises = await Exercise.find({});
    res.status(201).json({ message: "Exercises seeded successfully!", data: allExercises });
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};