import { Request, Response } from "express";
//import Review from "../models/Review";
//import Food from "../models/Food";

interface AuthRequest extends Request {
  user?: { id: string };
}

export const addReview = async (req: AuthRequest, res: Response) => {
}

export const getFoodReviews = async (req: Request, res: Response) => {
}