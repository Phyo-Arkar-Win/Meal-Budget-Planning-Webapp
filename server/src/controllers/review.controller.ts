import { Request, Response } from "express";
import Food from "../models/Food";
import Review from "../models/Review";

interface AuthRequest extends Request {
  user?: { id: string };
}

export const addReview = async (req: AuthRequest, res: Response) => {
  try {
    const { foodId, rating, comment } = req.body;

    const existingReview = await Review.findOne({ foodId, userId: req.user?.id });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this food item" });
    }

    const foodItem = await Food.findById(foodId);
    if (!foodItem) {
      return res.status(404).json({ message: "Food item not found" });
    }

    await Review.create({
      foodId,
      userId: req.user?.id,
      rating,
      comment
    });

    const avgRating = await Review.aggregate([
      { $match: { foodId: foodItem._id } },
      { $group: { _id: "$foodId", avg: { $avg: "$rating" } } }
    ]);

    await Food.findByIdAndUpdate(foodId, { averageRating: avgRating[0]?.avg || rating });

    res.status(201).json({ message: "Review added successfully" });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Server error while adding review" });
  }
};

export const getFoodReviews = async (req: Request, res: Response) => {
  try {
    const { foodId } = req.query;
    const reviews = await Review.find({ foodId }).populate("userId", "username");
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Server error while fetching reviews" });
  }
};