import express from 'express';
import {
  register,
  login,
  verifyOTP,
  getProfile,
  updateProfile,
  logout,
  forgotPassword,
  resetPassword,
  registerNewsletter
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/register-newsletter', registerNewsletter);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/logout', protect, logout);

export default router;
