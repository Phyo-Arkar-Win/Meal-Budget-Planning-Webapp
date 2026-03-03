// client/src/types/food.ts

export interface Food {
  _id:           string;
  name:          string;
  price:         number;
  canteen:       string;
  picture?:      string;
  averageRating: number;
  macros: {
    calories: number;
    carbs:    number;
    protein:  number;
    fat:      number;
    sugar:    number;
  };
}

export interface CreateFoodPayload {
  name:     string;
  price:    number;
  canteen:  string;
  picture?: string;
  macros: {
    calories: number;
    carbs:    number;
    protein:  number;
    fat:      number;
    sugar:    number;
  };
}

export interface ReviewUser {
  _id:      string;
  username: string;
}

export interface Review {
  _id:       string;
  foodId:    string;
  userId:    ReviewUser;
  rating:    number;
  comment:   string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewPayload {
  foodId:  string;
  rating:  number;
  comment: string;
}