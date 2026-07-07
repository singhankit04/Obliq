import User from '../models/user.model.js';
import Session from '../models/session.model.js';
import OTP from '../models/otp.model.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../utils/mailer.js';

// Internal helpers
const generateTokens = (userId, sessionId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET || 'access-secret', { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId, sessionId }, process.env.JWT_REFRESH_SECRET || 'refresh-secret', { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const createSessionAndTokens = async (user, userAgent, ip) => {
  const session = new Session({
    userId: user._id,
    refreshTokenHash: 'placeholder',
    userAgent,
    ip,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const { accessToken, refreshToken } = generateTokens(user._id, session._id);
  session.refreshTokenHash = hashToken(refreshToken);
  await session.save();

  return { accessToken, refreshToken };
};

// Exported services
export const sendSignupOtp = async (email) => {
  const userExists = await User.findOne({ email });
  if (userExists) {
    const error = new Error('User already exists');
    error.statusCode = 400;
    throw error;
  }

  // Generate 4 digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // Save/Update OTP
  await OTP.findOneAndDelete({ email }); // Remove existing if any
  await OTP.create({ email, otp });

  // Send Email
  await sendEmail({
    to: email,
    subject: 'Your Signup Verification OTP',
    html: `<p>Your verification code is: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`
  });
};

export const verifySignupOtp = async (email, otp) => {
  const otpRecord = await OTP.findOne({ email });
  if (!otpRecord) {
    const error = new Error('OTP not found or expired');
    error.statusCode = 400;
    throw error;
  }
 
  const isMatch = await otpRecord.matchOtp(otp);
 
  if (!isMatch) {
    const error = new Error('Invalid OTP');
    error.statusCode = 400;
    throw error;
  }
  otpRecord.isVerified = true;
  
  await otpRecord.save();
  

};

export const registerUser = async ({ name, email, password, userAgent, ip }) => {
  const userExists = await User.findOne({ email });
  if (userExists) {
    const error = new Error('User already exists');
    error.statusCode = 400;
    throw error;
  }

  const otpRecord = await OTP.findOne({ email, isVerified: true });
  if (!otpRecord) {
    const error = new Error('Email not verified. Please verify OTP first.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.create({ name, email, password });
  const tokens = await createSessionAndTokens(user, userAgent, ip);

  await OTP.deleteOne({ _id: otpRecord._id });

  return {
    user: { name: user.name, email: user.email },
    ...tokens
  };
};

export const loginUser = async ({ email, password, userAgent, ip }) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const tokens = await createSessionAndTokens(user, userAgent, ip);

  return {
    user: { name: user.name, email: user.email },
    ...tokens
  };
};

export const refreshAuthTokens = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error('No refresh token provided');
    error.statusCode = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret');
  } catch (err) {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 403;
    throw error;
  }

  const session = await Session.findById(decoded.sessionId);
  if (!session) {
    const error = new Error('Session not found');
    error.statusCode = 403;
    throw error;
  }

  if (!session.isValid) {
    // Security breach detected: someone used a revoked token. 
    // Invalidate all sessions for the user!
    await Session.updateMany({ userId: session.userId }, { isValid: false });
    const error = new Error('Invalid session');
    error.statusCode = 403;
    throw error;
  }

  const providedTokenHash = hashToken(refreshToken);
  if (session.refreshTokenHash !== providedTokenHash) {
    // Token reuse detected (family of tokens compromise)
    // Invalidate all sessions for the user to be safe
    await Session.updateMany({ userId: session.userId }, { isValid: false });
    const error = new Error('Token reuse detected. All sessions revoked.');
    error.statusCode = 403;
    throw error;
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId, session._id);

  session.refreshTokenHash = hashToken(newRefreshToken);
  session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await session.save();

  return { accessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (refreshToken) => {
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret', { ignoreExpiration: true });
      const providedTokenHash = hashToken(refreshToken);

      await Session.findOneAndUpdate(
        { _id: decoded.sessionId, refreshTokenHash: providedTokenHash },
        { isValid: false }
      );
    } catch (err) {
      // ignore
    }
  }
};

export const sendPasswordResetEmail = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    // Fail silently to prevent email enumeration
    return;
  }

  const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_RESET_SECRET || 'reset-secret', { expiresIn: '15m' });
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html: `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password.</p><p>This link is valid for 15 minutes.</p>`
  });
};

export const resetPassword = async (token, newPassword) => {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_RESET_SECRET || 'reset-secret');
  } catch (err) {
    const error = new Error('Invalid or expired password reset token');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  user.password = newPassword;
  await user.save(); // The pre-save hook will hash it

  // For security, revoke all active sessions so the user must log in with their new password
  await Session.updateMany({ userId: user._id }, { isValid: false });
};

export const searchUsersByEmail = async (email) => {
  return User.find({ email: { $regex: email, $options: 'i' } })
    .select('name email')
    .limit(10)
    .lean();
};
