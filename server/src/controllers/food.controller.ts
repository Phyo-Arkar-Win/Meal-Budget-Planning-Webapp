import { Request, Response } from "express";
//import Food from "../models/Food";

interface AuthRequest extends Request {
  user?: { id: string };
}

export const createFood = async (req: AuthRequest, res: Response) => {
}

export const getFoods = async (req: Request, res: Response) => {
}

export const getFoodById = async (req: Request, res: Response) => {
}

export const removeMealFromPlan = async (req: AuthRequest, res: Response) => {
}