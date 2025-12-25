import express from "express";
import User from "../db/models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Register bölümü kontrol amaçlı
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "This email is already registered." });
    }

    const user = new User({ name, email, password });
    await user.save();

    res.status(201).json({ message: "Registration successful!", userId: user._id });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login bölümü kontrol amaçlı
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User not found!" });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ message: "Password is wrong!" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    res.json({ message: "Login successful!", token });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout bölümü kontrol amaçlı
router.post("/logout", (req, res) => {
  res.json({ message: "Logout successful!" });
});

export default router;
