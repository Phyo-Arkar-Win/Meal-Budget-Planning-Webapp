// server/src/controllers/food.controller.ts
import { Request, Response } from "express";
import Food from "../models/Food";

interface AuthRequest extends Request {
  user?: { id: string };
}

// @desc    Get all foods (with optional search/filter)
// @route   GET /api/foods
export const getFoods = async (req: Request, res: Response) => {
  try {
    const { search, canteen } = req.query;

    const query: any = {};
    if (search)  query.name    = { $regex: search,  $options: "i" };
    if (canteen) query.canteen = { $regex: canteen, $options: "i" };

    const foods = await Food.find(query).sort({ name: 1 });
    res.status(200).json(foods);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get single food by ID
// @route   GET /api/foods/:id
export const getFoodById = async (req: Request, res: Response) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: "Food not found" });
    res.status(200).json(food);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Create a new food item
// @route   POST /api/foods
export const createFood = async (req: AuthRequest, res: Response) => {
  try {
    const { name, price, canteen, picture, macros } = req.body;
    const food = await Food.create({ name, price, canteen, picture, macros });
    res.status(201).json(food);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};