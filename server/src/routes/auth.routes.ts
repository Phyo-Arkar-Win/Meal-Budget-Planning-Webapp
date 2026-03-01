import { Router } from "express";
import { signup, login, googleLogin, changePassword } from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/signup",          signup);
router.post("/login",           login);
router.post("/google",          googleLogin);
router.post("/change-password", protect, changePassword);

export default router;