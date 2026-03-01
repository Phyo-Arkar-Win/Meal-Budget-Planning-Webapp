import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";

// sign JWT
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
    username,
    email,
    password: hashedPassword,
    gender,
    age,
    weight,
    height,
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
// accepts access_token, fetches user info from Google's userinfo endpoint.
// No verifyIdToken needed — zero impact on auth.middleware.ts or any
// protected route. The JWT we issue is identical to the manual login JWT.
export const googleLogin = async (req: Request, res: Response) => {
  const { token } = req.body;

  try {
    // Fetch user info from Google using the access_token
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!userInfoRes.ok) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const payload = await userInfoRes.json();
    const { email, name, sub: googleId, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: "Could not retrieve email from Google" });
    }

    // Look up existing user by email (handles account linking)
    // If the user previously signed up manually, this finds their account and
    // attaches the googleId — same account, works with both login methods.
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      // create with Google info, personal details filled later
      const dummyPassword = await bcrypt.hash(googleId, 10);

      user = await User.create({
        username: name || email.split("@")[0],
        email,
        googleId,
        password: dummyPassword,
        profile_picture: picture || "",
        gender: "male",
        age: 0,
        weight: 0,
        height: 0,
      });
      isNewUser = true;
    } else {
      // Existing user (manual or Google) — attach googleId and picture if missing
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.profile_picture && picture) {
        user.profile_picture = picture;
      }
      await user.save();
      // isNewUser stays false → frontend redirects straight to /
    }

    const jwtToken = signToken(String(user._id));

    // isNewUser: true  → frontend redirects to /complete-profile
    // isNewUser: false → frontend redirects to /
    res.json({ token: jwtToken, isNewUser });

  } catch (error) {
    console.error("Google Login Error:", error);
    return res.status(500).json({ message: "Google login failed" });
  }
};