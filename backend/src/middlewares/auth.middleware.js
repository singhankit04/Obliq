import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protect = async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.headers?.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'access-secret');
    req.user = await User.findById(decoded.userId).select('-password');
    next();
  } catch (error) {
    next(error);
  }
};
