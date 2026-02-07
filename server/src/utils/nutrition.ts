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

  if (user.fitness_goal === 'Muscle Gain') {
    k_multiplier += 0.1; 
  }

  const protein_target = Math.round(user.weight * k_multiplier);


  // 3. FAT TARGET (~30% of TDEE) 
  // Formula: (TDEE * 0.30) / 9 calories per gram
  const fat_calories = tdee * 0.30;
  const fat_target = Math.round(fat_calories / 9);


  // 4. SUGAR TARGET (<10% of TDEE) 
  // Formula: (TDEE * 0.10) / 4 calories per gram
  const sugar_target = Math.round((tdee * 0.10) / 4);

  return {
    protein_target,
    fat_target,
    sugar_target
  };
};