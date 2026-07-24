import * as authService from '../services/auth.service.js';

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const sendOtp = async (req, res, next) => {
  try {
    const { email, type } = req.body;
    await authService.sendSignupOtp(email, type);
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;

    const result = await authService.verifySignupOtp(email, otp, userAgent, ip);

    if (result?.isLogin) {
      setCookies(res, result.accessToken, result.refreshToken);
      return res.json({
        message: 'Login successful',
        user: result.user
      });
    }

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;

    const result = await authService.registerUser({ name, email, password, userAgent, ip });

    setCookies(res, result.accessToken, result.refreshToken);

    res.status(201).json({
      message: 'Signup successful',
      user: result.user
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;

    const result = await authService.loginUser({ email, password, userAgent, ip });

    setCookies(res, result.accessToken, result.refreshToken);

    res.json({
      message: 'Login successful',
      user: result.user
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    const result = await authService.refreshAuthTokens(refreshToken);

    setCookies(res, result.accessToken, result.refreshToken);
    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    await authService.logoutUser(refreshToken);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    await authService.sendPasswordResetEmail(email);

    // We always send the same message to prevent email enumeration
    res.json({ message: 'If that email is registered, a password reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    await authService.resetPassword(token, newPassword);

    res.json({ message: 'Password has been reset successfully. Please log in with your new password.' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

export const searchUsers = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email query parameter is required' });
    }
    const users = await authService.searchUsersByEmail(email);
    res.json({ users });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;

    const result = await authService.loginWithGoogle({ credential, userAgent, ip });

    setCookies(res, result.accessToken, result.refreshToken);

    res.json({
      message: 'Google login successful',
      user: result.user
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};
