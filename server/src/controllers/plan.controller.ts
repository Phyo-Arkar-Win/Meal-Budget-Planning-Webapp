import { Request, Response } from "express";
//import Plan from "../models/Plan";
//import Food from "../models/Food";

interface AuthRequest extends Request {
  user?: { id: string };
}

export const createPlan = async (req: AuthRequest, res: Response) => {
}

export const getUserPlans = async (req: AuthRequest, res: Response) => {
}

export const addMealToPlan = async (req: AuthRequest, res: Response) => {
}

export const removeMealFromPlan = async (req: AuthRequest, res: Response) => {
}