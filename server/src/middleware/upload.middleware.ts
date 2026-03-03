import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Profile pictures ──────────────────────────────────────────────────────────
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:           'meal_app_profiles',
    allowed_formats:  ['jpg', 'jpeg', 'png', 'webp'],
    transformation:   [{ width: 500, height: 500, crop: 'limit' }],
  } as any,
});

// ── Food pictures ─────────────────────────────────────────────────────────────
const foodStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'meal_app_foods',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 800, height: 600, crop: 'limit' }],
  } as any,
});

export const upload     = multer({ storage: profileStorage });
export const uploadFood = multer({ storage: foodStorage });