import User from '../models/user.model.js';
import Session from '../models/session.model.js';
import redis from '../config/redis.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../utils/mailer.js';
import { recordOtpRequest, recordFailedLogin, clearFailedLogins, recordFailedOtpVerify } from '../middlewares/rateLimiter.middleware.js';

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
export const sendSignupOtp = async (email, type = 'signup') => {
  const userExists = await User.findOne({ email });

  if (type === 'signup' && userExists) {
    const error = new Error('User already exists');
    error.statusCode = 400;
    throw error;
  }

  if (type === 'login' && !userExists) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Generate 4 digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // Hash OTP for Redis storage
  const hashedOtp = await bcrypt.hash(otp, 10);

  // Save/Update OTP in Redis (10 minutes TTL = 600 seconds)
  await redis.set(`otp:${email}`, JSON.stringify({ otp: hashedOtp, type, isVerified: false }), 'EX', 600);

  // Record OTP request event (sets 60s cooldown and increments 10-min counter)
  await recordOtpRequest(email);

  // Send Email
  const subject = type === 'login' ? 'Your Login Verification OTP' : 'Your Signup Verification OTP';
  await sendEmail({
    to: email,
    subject,
    html: `<p>Your verification code is: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`
  });
};

export const verifySignupOtp = async (email, otp, userAgent, ip) => {
  const data = await redis.get(`otp:${email}`);
  if (!data) {
    const error = new Error('OTP not found or expired');
    error.statusCode = 400;
    throw error;
  }

  const otpRecord = JSON.parse(data);
  const isMatch = await bcrypt.compare(otp, otpRecord.otp);

  if (!isMatch) {
    const wasInvalidated = await recordFailedOtpVerify(email);
    const error = new Error(
      wasInvalidated
        ? 'Too many failed attempts. OTP has been invalidated. Please request a new OTP.'
        : 'Invalid OTP'
    );
    error.statusCode = 400;
    throw error;
  }

  if (otpRecord.type === 'login') {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const tokens = await createSessionAndTokens(user, userAgent, ip);
    await redis.del(`otp:${email}`);

    return {
      isLogin: true,
      user: { name: user.name, email: user.email },
      ...tokens,
    };
  }

  // Mark as verified for signup flow
  await redis.set(`otp:${email}`, JSON.stringify({ ...otpRecord, isVerified: true }), 'EX', 600);
  return { isLogin: false };
};

export const registerUser = async ({ name, email, password, userAgent, ip }) => {
  const userExists = await User.findOne({ email });

  if (userExists) {
    const error = new Error('User already exists');
    error.statusCode = 400;
    throw error;
  }

  const data = await redis.get(`otp:${email}`);
  const otpRecord = data ? JSON.parse(data) : null;


  if (!otpRecord || !otpRecord.isVerified) {
    const error = new Error('Email not verified. Please verify OTP first.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.create({ name, email, password });
  const tokens = await createSessionAndTokens(user, userAgent, ip);

  await redis.del(`otp:${email}`);

  return {
    user: { name: user.name, email: user.email },
    ...tokens
  };
};

export const loginUser = async ({ email, password, userAgent, ip }) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    await recordFailedLogin(email);
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  await clearFailedLogins(email);

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
  return User.find({email: email.toLowerCase()})
    .select('name email')
    .limit(10)
    .lean();
};

export const loginWithGoogle = async ({ credential, userAgent, ip }) => {
  let ticket;
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!response.ok) {
      throw new Error('Failed to verify Google token');
    }
    ticket = await response.json();
  } catch (err) {
    const error = new Error('Invalid Google token');
    error.statusCode = 400;
    throw error;
  }

  const { email, name, sub: googleId, aud } = ticket;

  const expectedClientId = process.env.GOOGLE_CLIENT_ID;
  if (expectedClientId && aud !== expectedClientId) {
    const error = new Error('Invalid audience: Client ID mismatch');
    error.statusCode = 400;
    throw error;
  }

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (!user) {
    user = await User.create({
      name,
      email,
      googleId,
    });
  } else {
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
  }

  const tokens = await createSessionAndTokens(user, userAgent, ip);

  return {
    user: { name: user.name, email: user.email },
    ...tokens
  };
};
