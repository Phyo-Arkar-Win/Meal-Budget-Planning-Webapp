import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth.middleware";

const signToken = (userId: string) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "1d" });

// Manual Signup 
export const signup = async (req: Request, res: Response) => {
  const { username, email, password, gender, age, weight, height } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser)
    return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    username, email, password: hashedPassword, gender, age, weight, height,
  });

  const token = signToken(String(user._id));
  res.status(201).json({ message: "User created", token });
};

// Manual Login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: "Email or Password Incorrect!" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.status(400).json({ message: "Email or Password Incorrect!" });

  const token = signToken(String(user._id));
  res.json({ token });
};

// Google Login / Signup
export const googleLogin = async (req: Request, res: Response) => {
  const { token } = req.body;

  try {
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!userInfoRes.ok)
      return res.status(400).json({ message: "Invalid Google token" });

    const payload = await userInfoRes.json();
    const { email, name, sub: googleId, picture } = payload;

    if (!email)
      return res.status(400).json({ message: "Could not retrieve email from Google" });

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      const tempPassword = await bcrypt.hash(googleId, 10);
      user = await User.create({
        username:        name || email.split("@")[0],
        email,
        googleId,
        password:        tempPassword,
        profile_picture: picture || "",
        // Required schema fields — all overwritten at /complete-profile
        gender: "male",
        age:    1,
        weight: 1,
        height: 1,
      });
      isNewUser = true;
    } else {
      // Existing user (manual signup) — link Google, keep their real password
      if (!user.googleId) user.googleId = googleId;
      if (!user.profile_picture && picture) user.profile_picture = picture;
      await user.save();
    }

    const jwtToken = signToken(String(user._id));
    // isNewUser: true  → frontend sends to /complete-profile to set real password + info
    // isNewUser: false → frontend sends to /
    res.json({ token: jwtToken, isNewUser });

  } catch (error) {
    console.error("Google Login Error:", error);
    return res.status(500).json({ message: "Google login failed" });
  }
};

// Change Password (from EditProfile page)
export const changePassword = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ message: "New password must be at least 6 characters." });

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch)
    return res.status(400).json({ message: "Current password is incorrect." });

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: "Password changed successfully." });
};