// src/utils/exercise.utils.ts
// Extracted from nutrition.ts — import from here for exercise calorie calculations.

/**
 * Calculate calories burned from exercise.
 * @param calPerHour - Calories burned per hour for the exercise
 * @param durationMinutes - Duration of exercise in minutes
 * @returns Calories burned (rounded)
 */
export const calculateCaloriesBurned = (
  calPerHour: number,
  durationMinutes: number
): number => {
  return Math.round((calPerHour * durationMinutes) / 60);
};

/**
 * Get exercise calorie offset for daily targets.
 * When a user exercises, they burn extra calories which offsets their calorie limit.
 * @param calPerHour - Calories burned per hour for the exercise
 * @param durationMinutes - Duration of exercise in minutes
 * @returns The offset amount (positive number to add back to calorie allowance)
 */
export const getExerciseCalorieOffset = (
  calPerHour: number,
  durationMinutes: number
): number => {
  return calculateCaloriesBurned(calPerHour, durationMinutes);
};