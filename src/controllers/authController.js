import User from '../db/models/User.js';
import { Session } from '../db/models/session.js';
import jwt from 'jsonwebtoken';
import createError from 'http-errors';

const createSession = async (userId) => {
  await Session.deleteOne({ userId });
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '15m',
  });
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '30d' },
  );

  return await Session.create({
    userId,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + 15 * 60 * 1000),
    refreshTokenValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) throw createError(409, 'User already exists');
    await User.create({ name, email, password });
    res.status(201).json({ status: 201, message: 'Registration successful' });
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      throw createError(401, 'Invalid credentials');
    const session = await createSession(user._id);
    res.json({
      status: 200,
      data: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const refreshTokens = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const session = await Session.findOne({
      refreshToken,
      refreshTokenValidUntil: { $gt: new Date() },
    });
    if (!session) throw createError(401, 'Session expired');
    const newSession = await createSession(session.userId);
    res.json({
      status: 200,
      data: {
        accessToken: newSession.accessToken,
        refreshToken: newSession.refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getDailyData = async (req, res, next) => {
  try {
    const { date } = req.query;
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const data = await User.find({ createdAt: { $gte: start, $lte: end } });
    res.json({ status: 200, data });
  } catch (err) {
    next(err);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    if (req.body.refreshToken)
      await Session.deleteOne({ refreshToken: req.body.refreshToken });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
