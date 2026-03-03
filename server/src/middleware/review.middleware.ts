import { Request, Response, NextFunction } from "express";

export const validateReviewInput = (req: Request, res: Response, next: NextFunction) => {
  const { foodId, rating, comment } = req.body;
    if (!foodId || !rating) {
      return res.status(400).json({ message: "foodId and rating are required" });
  }
  next();
};

export const validateGetFoodReviewsInput = (req: Request, res: Response, next: NextFunction) => {
  const { foodId } = req.query;
  if (!foodId) {
    return res.status(400).json({ message: "foodId is required" });
  }
  next();
};