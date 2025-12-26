import jwt from 'jsonwebtoken';
import { Session } from '../db/models/session.js';
import User from '../db/models/User.js';
import createError from 'http-errors';

const authenticate = async (req, res, next) => {
  try {
    const { authorization = '' } = req.headers;
    const [bearer, token] = authorization.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw createError(401, 'Not authorized');
    }

    // Token'ı verify et
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Session'ı kontrol et
    const session = await Session.findOne({
      userId: decoded.userId,
      accessToken: token,
      accessTokenValidUntil: { $gt: new Date() },
    });

    if (!session) {
      throw createError(401, 'Not authorized');
    }

    // Kullanıcıyı bul
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw createError(401, 'Not authorized');
    }

    // Kullanıcıyı request objesine ekle
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(createError(401, 'Not authorized'));
    } else {
      next(error);
    }
  }
};

export default authenticate;

