import { Request, Response } from "express";
//import { Recommendation, Exercise } from "../models/Exercise"; // Adjust imports based on your structure
//import Plan from "../models/Plan";
//import User from "../models/User";

interface AuthRequest extends Request {
  user?: { id: string };
}

export const generateRecommendation = async (req: AuthRequest, res: Response) => {
}

