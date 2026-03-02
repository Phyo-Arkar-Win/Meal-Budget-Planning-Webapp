import { Request, Response } from "express";
import Review from "../models/Review";
import Food from "../models/Food";

interface AuthRequest extends Request {
  user?: { id: string };
}

export const addReview = async (req: AuthRequest, res: Response) => {
  try {
    const { foodId } = req.params;
    const { review_text, stars } = req.body;
    const userId = req.user?.id;

    if (!review_text || !stars) {
      return res.status(400).json({ message: "Review text and stars are required." });
    }

    if (stars < 1 || stars > 5) {
      return res.status(400).json({ message: "Stars must be between 1 and 5." });
    }

    const food = await Food.findById(foodId);
    if (!food) {
      return res.status(404).json({ message: "Food item not found"});
    }

    const newReview = new Review({
      food_id: foodId,
      user_id: userId,
      review_text,
      stars
    });

    await newReview.save()
    await newReview.populate('user_id', 'username profile_picture');

    return res.status(201).json({
      message: "Review added successfully",
      data: newReview
    });
  } catch (error) {
    console.error("Error adding review:", error);
    return res.status(500).json({ message: "Server error adding review" });
  }
}

export const getFoodReviews = async (req: Request, res: Response) => {
  try {
    const {foodId} = req.params;

    const reviews = await Review.find({ food_id : foodId})
    .populate("user_id", "username profile_picture")
    .sort({ createdAt: -1 })

    return res.status(200).json({
      message: "Reviews fetched successfully",
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({ message: "Server error fetching reviews" });
  }
};