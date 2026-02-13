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
  options?: { activity_level?: ActivityLevel; fitness_goal?: FitnessGoal },
) => {
  // TDEE for Fat/Sugar
  let bmr: number;
  if (user.gender === "male") {
    bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5;
  } else {
    bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age - 161;
  }

  const activityMultipliers: Record<ActivityLevel, number> = {
    Sedentary: 1.2,
    "Lightly Active": 1.375,
    "Moderately Active": 1.55,
    "Very Active": 1.725,
    "Extremely Active": 1.9,
  };

  const activity_level = options?.activity_level ?? "Sedentary";
  const activityFactor = activityMultipliers[activity_level] || 1.2;
  const tdee = bmr * activityFactor;

  let totalDailyCalories: number;
  let proteinK: number;
  let fatPercentage: number;
  let sugarPercentage: number;

  const goal = options?.fitness_goal ?? user.fitness_goal ?? "Maintenance";

  switch (goal) {
    case "Muscle Gain":
      totalDailyCalories = tdee * 1.2; // 120% of TDEE
      proteinK = 2.0; // k = 2.0
      fatPercentage = 0.25; // 25%
      sugarPercentage = 0.1; // 10%
      break;

    case "Weight Loss":
      totalDailyCalories = tdee * 0.8; // 80% of TDEE
      proteinK = 2.0; // k = 2.0
      fatPercentage = 0.2; // 20%
      sugarPercentage = 0.05; // 5%
      break;

    case "Maintenance":
    default:
      totalDailyCalories = tdee; // TDEE
      proteinK = 1.6; // k = 1.6
      fatPercentage = 0.25; // 25%
      sugarPercentage = 0.1; // 10%
      break;
  }

  // Protein (g) = W x k -- 4 kcal/g
  const protein_target = Math.round(user.weight * proteinK);
  const protein_calories = Math.round(protein_target * 4);

  // Fat (g) = (Total Calories * Fat%) / 9 kcal/g
  const fat_calories = totalDailyCalories * fatPercentage;
  const fat_target = Math.round(fat_calories / 9);

  // Sugar (g) = (Total Calories * Sugar%) / 4 kcal/g
  const sugar_calories = totalDailyCalories * sugarPercentage;
  const sugar_target = Math.round(sugar_calories / 4);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    protein_target,
    fat_target,
    sugar_target,
  };
};
