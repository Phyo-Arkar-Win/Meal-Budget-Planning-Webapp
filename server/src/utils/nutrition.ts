import { IUser } from "../models/User";

type ActivityLevel =
  | "Sedentary"
  | "Lightly Active"
  | "Moderately Active"
  | "Very Active"
  | "Extremely Active";

type FitnessGoal = "Weight Loss" | "Maintenance" | "Muscle Gain";

export const calculateSpecificMacros = (
  user: IUser,
  options?: { activity_level?: ActivityLevel; fitness_goal?: FitnessGoal }
) => {
  // 1) BMR (Mifflin-St Jeor)
  let bmr: number;
  if (user.gender === "male") {
    bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5;
  } else {
    bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age - 161;
  }

  // 2) TDEE
  const activityMultipliers: Record<ActivityLevel, number> = {
    Sedentary: 1.2,
    "Lightly Active": 1.375,
    "Moderately Active": 1.55,
    "Very Active": 1.725,
    "Extremely Active": 1.9,
  };

  const activity_level = options?.activity_level ?? "Sedentary";
  const activityFactor = activityMultipliers[activity_level] ?? 1.2;
  const tdee = bmr * activityFactor;

  // 3) Goal settings (Calories, Protein k, Fat %, Sugar %)
  let totalDailyCalories: number;
  let proteinK: number;
  let fatPercentage: number;
  let sugarPercentage: number;

  // YOUR version: options?.fitness_goal takes priority, falls back to user.fitness_goal
  const goal = options?.fitness_goal ?? user.fitness_goal ?? "Maintenance";

  switch (goal) {
    case "Muscle Gain":
      totalDailyCalories = tdee * 1.2;
      proteinK = 2.0;
      fatPercentage = 0.25;
      sugarPercentage = 0.1;
      break;

    case "Weight Loss":
      totalDailyCalories = tdee * 0.8;
      proteinK = 2.0;
      fatPercentage = 0.2;
      sugarPercentage = 0.05;
      break;

    case "Maintenance":
    default:
      totalDailyCalories = tdee;
      proteinK = 1.6;
      fatPercentage = 0.25;
      sugarPercentage = 0.1;
      break;
  }

  // 4) Protein (g) = W * k ; 4 kcal/g
  const protein_target = Math.round(user.weight * proteinK);

  // 5) Fat (g) = (Total Calories * Fat%) / 9 kcal/g
  const fat_calories = totalDailyCalories * fatPercentage;
  const fat_target = Math.round(fat_calories / 9);

  // 6) Sugar (g) = (Total Calories * Sugar%) / 4 kcal/g
  const sugar_calories = totalDailyCalories * sugarPercentage;
  const sugar_target = Math.round(sugar_calories / 4);

  // 7) Carbs (g) = Remaining calories / 4 kcal/g
  // Sugar is part of carbs — do NOT subtract separately
  const used_calories = protein_target * 4 + fat_target * 9;
  const carb_calories = totalDailyCalories - used_calories;
  const carb_target = Math.max(0, Math.round(carb_calories / 4));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    totalDailyCalories: Math.round(totalDailyCalories),
    protein_target,
    fat_target,
    sugar_target,
    carb_target,
  };
};