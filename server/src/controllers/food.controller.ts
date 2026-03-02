// server/src/controllers/food.controller.ts
import { Request, Response } from "express";
import Food from "../models/Food";

// @desc    Get all foods (optional ?search= and ?canteen= query params)
// @route   GET /api/foods
export const getFoods = async (req: Request, res: Response) => {
  try {
    const { search, canteen } = req.query;
    const query: any = {};
    if (search)  query.name    = { $regex: search,  $options: "i" };
    if (canteen) query.canteen = { $regex: canteen, $options: "i" };

    const foods = await Food.find(query).sort({ canteen: 1, name: 1 });
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

// @desc    Create a new food item (called by AddFood.tsx)
// @route   POST /api/foods
export const createFood = async (req: Request, res: Response) => {
  try {
    const { name, price, canteen, picture, macros } = req.body;

    if (!name || !price || !canteen || !macros) {
      res.status(400).json({ message: "name, price, canteen and macros are required." });
      return;
    }

    const food = await Food.create({ name, price, canteen, picture, macros });
    res.status(201).json(food);
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Seed sample foods for development/testing (upsert — safe to call many times)
// @route   POST /api/foods/seed
export const seedFoods = async (req: Request, res: Response) => {
  try {
    const samples = [
      // ── Main Cafeteria ─────────────────────────────────────────────────────
      { name: "Grilled Chicken Rice",       price: 45, canteen: "Main Cafeteria",           macros: { calories: 520, carbs: 58, protein: 38, fat: 10, sugar: 3  } },
      { name: "Grilled Chicken Salad",      price: 45, canteen: "Main Cafeteria",           macros: { calories: 350, carbs: 15, protein: 40, fat: 12, sugar: 4  } },
      { name: "Fruit Bowl",                 price: 30, canteen: "Main Cafeteria",           macros: { calories: 150, carbs: 35, protein: 2,  fat: 1,  sugar: 25 } },
      { name: "Stir-Fried Morning Glory",   price: 35, canteen: "Main Cafeteria",           macros: { calories: 180, carbs: 12, protein: 5,  fat: 11, sugar: 3  } },
      { name: "Boiled Eggs (2 pcs)",        price: 20, canteen: "Main Cafeteria",           macros: { calories: 140, carbs: 1,  protein: 12, fat: 10, sugar: 1  } },
      { name: "Brown Rice",                 price: 15, canteen: "Main Cafeteria",           macros: { calories: 215, carbs: 45, protein: 5,  fat: 2,  sugar: 0  } },

      // ── Engineering Canteen ────────────────────────────────────────────────
      { name: "Spicy Basil Pork with Rice", price: 50, canteen: "Engineering Canteen",      macros: { calories: 600, carbs: 65, protein: 25, fat: 20, sugar: 8  } },
      { name: "Pad Thai",                   price: 55, canteen: "Engineering Canteen",      macros: { calories: 580, carbs: 70, protein: 22, fat: 18, sugar: 10 } },
      { name: "Green Curry with Rice",      price: 55, canteen: "Engineering Canteen",      macros: { calories: 620, carbs: 60, protein: 28, fat: 22, sugar: 6  } },
      { name: "Fried Rice with Egg",        price: 45, canteen: "Engineering Canteen",      macros: { calories: 530, carbs: 72, protein: 15, fat: 16, sugar: 2  } },
      { name: "Som Tum (Papaya Salad)",     price: 40, canteen: "Engineering Canteen",      macros: { calories: 130, carbs: 22, protein: 4,  fat: 2,  sugar: 14 } },

      // ── Science Canteen ────────────────────────────────────────────────────
      { name: "Beef Noodle Soup",           price: 60, canteen: "Science Canteen",          macros: { calories: 500, carbs: 55, protein: 30, fat: 15, sugar: 5  } },
      { name: "Tom Yum Noodle Soup",        price: 55, canteen: "Science Canteen",          macros: { calories: 420, carbs: 50, protein: 26, fat: 12, sugar: 4  } },
      { name: "Wonton Soup",                price: 45, canteen: "Science Canteen",          macros: { calories: 310, carbs: 38, protein: 20, fat: 7,  sugar: 3  } },
      { name: "Congee with Pork",           price: 40, canteen: "Science Canteen",          macros: { calories: 280, carbs: 42, protein: 16, fat: 5,  sugar: 2  } },

      // ── Arts Faculty Food Court ────────────────────────────────────────────
      { name: "Mango Sticky Rice",          price: 50, canteen: "Arts Faculty Food Court",  macros: { calories: 380, carbs: 72, protein: 5,  fat: 8,  sugar: 30 } },
      { name: "Banana Pancake",             price: 35, canteen: "Arts Faculty Food Court",  macros: { calories: 320, carbs: 52, protein: 6,  fat: 10, sugar: 18 } },
      { name: "Grilled Pork Skewer (3pcs)", price: 40, canteen: "Arts Faculty Food Court",  macros: { calories: 270, carbs: 5,  protein: 28, fat: 15, sugar: 3  } },
      { name: "Tofu Stir Fry with Rice",    price: 45, canteen: "Arts Faculty Food Court",  macros: { calories: 420, carbs: 55, protein: 18, fat: 12, sugar: 4  } },
      { name: "Fresh Spring Rolls (2 pcs)", price: 35, canteen: "Arts Faculty Food Court",  macros: { calories: 200, carbs: 28, protein: 8,  fat: 6,  sugar: 4  } },
    ];

    // Upsert by name — running this multiple times never creates duplicates
    for (const food of samples) {
      await Food.findOneAndUpdate({ name: food.name }, food, { upsert: true, new: true });
    }

    const all = await Food.find({}).sort({ canteen: 1, name: 1 });
    res.status(201).json({
      message: `${samples.length} foods seeded successfully!`,
      total: all.length,
      data: all,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};