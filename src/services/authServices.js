/* eslint-disable no-unused-vars */
import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import { userModel } from '../db/models/userModel.js';
import { randomBytes } from 'node:crypto';
import { FIFTEEN_MINUTES, ONE_DAY } from '../constants/indexConstants.js';
import { SessionModel } from '../db/models/sessionModel.js';

export const registerUser = async (userData) => {
  const { name, email, password } = userData;
  const ifUserExist = await getUserByEmail(email);

  if (ifUserExist) {
    throw createHttpError(409, 'User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return await userModel.create({ ...userData, password: hashedPassword });
};

export const getUserByEmail = async (email) => {
  try {
    return await userModel.findOne({ email });
  } catch (error) {
    throw createHttpError(404, 'User not found', error);
  }
};

export const loginUser = async (userData) => {
  const { email, password } = userData;

  const ifUserExist = await getUserByEmail(email);
  if (!ifUserExist) {
    throw createHttpError(404, 'User not found');
  }

  const isPasswordValid = await bcrypt.compare(password, ifUserExist.password);
  if (!isPasswordValid) {
    throw createHttpError(401, 'incorrect password');
  }

  await SessionModel.deleteMany({ userId: ifUserExist._id });

  const accessToken = randomBytes(30).toString('hex');
  const refreshToken = randomBytes(30).toString('hex');
  const accessTokenValidUntil = new Date(Date.now() + FIFTEEN_MINUTES);
  const refreshTokenValidUntil = new Date(Date.now() + ONE_DAY);

  const session = await SessionModel.create({
    userId: ifUserExist._id,
    accessToken,
    refreshToken,
    accessTokenValidUntil,
    refreshTokenValidUntil,
  });

  return session;
};

export const logoutUser = async (sessionId) => {
  await SessionModel.findOneAndDelete(sessionId);
};

export const refreshUser = async ({ refreshToken, sessionId }) => {
  const session = await SessionModel.findById(sessionId);

  if (!session) {
    throw createHttpError(404, 'Session not found');
  }

  if (session.refreshTokenValidUntil < new Date()) {
    throw createHttpError(401, 'Session expired');
  }

  const accessTokenNew = randomBytes(30).toString('hex');
  const refreshTokenNew = randomBytes(30).toString('hex');
  const accessTokenValidUntilNew = new Date(Date.now() + FIFTEEN_MINUTES);
  const refreshTokenValidUntilNew = new Date(Date.now()) + ONE_DAY;

  const sessionNew = await SessionModel.create({
    userId: session.userId,
    accessToken: accessTokenNew,
    refreshToken: refreshTokenNew,
    accessTokenValidUntil: accessTokenValidUntilNew,
    refreshTokenValidUntil: refreshTokenValidUntilNew,
  });

  await SessionModel.findOneAndDelete(sessionId);

  return sessionNew;
};
