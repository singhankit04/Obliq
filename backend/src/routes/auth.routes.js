import express from 'express';
import { signup, login, refresh, logout, forgotPassword, resetPassword, sendOtp, verifyOtp, searchUsers } from '../controllers/auth.controller.js';
import { validate, signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, sendOtpSchema, verifyOtpSchema } from '../validations/auth.validation.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/send-otp', validate(sendOtpSchema), sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.get('/users/search', protect, searchUsers);

export default router;
