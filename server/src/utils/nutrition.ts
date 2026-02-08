import { IUser } from "../models/User";

export const calculateSpecificMacros = (user: IUser) => {
  // TDEE for Fat/Sugar
  let bmr: number;
  if (user.gender === 'male') {
    bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age) + 5;
  } else {
    bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age) - 161;
  }

  const activityMultipliers: Record<string, number> = {
    'Sedentary': 1.2,
    'Lightly Active': 1.375,
    'Moderately Active': 1.55,
    'Very Active': 1.725,
    'Extremely Active': 1.9 
  };

  const activityFactor = activityMultipliers[user.activity_level] || 1.2;
  const tdee = bmr * activityFactor;

  // 2. PROTEIN TARGET (Bodyweight * k)
  let k_multiplier = 1.2; 

  switch (user.activity_level) {
    case 'Sedentary':        k_multiplier = 1.2; break; 
    case 'Lightly Active':   k_multiplier = 1.375; break; 
    case 'Moderately Active':k_multiplier = 1.55; break; 
    case 'Very Active':      k_multiplier = 1.725; break; 
    case 'Extremely Active': k_multiplier = 1.9; break;
    default:                 k_multiplier = 1.2;
  }

<<<<<<< Updated upstream
  if (user.fitness_goal === 'Muscle Gain') {
    k_multiplier += 0.1; 
=======
  const fitness_goal = options?.fitness_goal ?? 'Maintenance';

  let totalDailyCalories: number; 
  let proteinK: number;           
  let fatPercentage: number;      
  let sugarPercentage: number;    

  switch (user.fitness_goal) {
    case 'Muscle Gain':
      totalDailyCalories = tdee * 1.20; // 120% of TDEE
      proteinK = 2.0;                   // k = 2.0
      fatPercentage = 0.25;             // 25%
      sugarPercentage = 0.10;           // 10%
      break;

    case 'Weight Loss':
      totalDailyCalories = tdee * 0.80; // 80% of TDEE
      proteinK = 2.0;                   // k = 2.0
      fatPercentage = 0.20;             // 20%
      sugarPercentage = 0.05;           // 5%
      break;

    case 'Maintenance':
    default:
      totalDailyCalories = tdee;        // TDEE
      proteinK = 1.6;                   // k = 1.6
      fatPercentage = 0.25;             // 25%
      sugarPercentage = 0.10;           // 10%
      break;
>>>>>>> Stashed changes
  }


// Protein (g) = W x k -- 4 kcal/g
  const protein_target = Math.round(user.weight * proteinK);
  const protein_calories = Math.round(protein_target * 4)

// Fat (g) = (Total Calories * Fat%) / 9 kcal/g
  const fat_calories = totalDailyCalories * fatPercentage;
  const fat_target = Math.round(fat_calories / 9);

// Sugar (g) = (Total Calories * Sugar%) / 4 kcal/g
  const sugar_calories = totalDailyCalories * sugarPercentage;
  const sugar_target = Math.round(sugar_calories / 4);

  return {
    protein_target,
    fat_target,
    sugar_target
  };
};