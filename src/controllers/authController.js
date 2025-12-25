import User from "../db/models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    res.status(201).json({
      user: { id: newUser._id, name: newUser.name, email: newUser.email }, token,
      message: "Registration successful"});
  
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    res.json({ user: { id: user._id, name: user.name, email: user.email }, token, message: "Login successful" });
  
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const logoutUser = (req, res) => {
  res.json({ message: "Logout successful"});
};

