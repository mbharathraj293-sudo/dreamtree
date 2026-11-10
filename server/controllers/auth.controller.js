import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { sendOTPEmail, sendResetEmail } from '../services/email.service.js';
import logger from '../utils/logger.js';

// Helper: Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'dreaming_tree_luxury_secret_key_2026_jwt_token',
    { expiresIn: '7d' }
  );
};

// 1. User Registration
export const register = async (req, res, next) => {
  const { email, password, name, phone } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
        role: 'CUSTOMER' // Defaults to customer, admins created via seeds/database directly
      }
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    next(error);
  }
};

// 2. User Login (Admin & Staff & Customers)
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const token = generateToken(user.id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days session

    // OTP verification check for administrative roles
    if ((user.role === 'SUPERADMIN' || user.role === 'ADMIN') && process.env.ADMIN_OTP_ENABLED === 'true') {
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
      const otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // 10 minutes expiry

      await prisma.user.update({
        where: { id: user.id },
        data: { otpCode: otp, otpExpiry }
      });

      // Send code in background
      await sendOTPEmail(user.email, user.name, otp);

      return res.status(200).json({
        success: true,
        requiresOTP: true,
        userId: user.id,
        message: 'Verification code sent to your registered email address.'
      });
    }

    // Save active database session
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        device: req.headers['user-agent'] || 'Unknown Device',
        ipAddress: req.ip || '127.0.0.1',
        expiresAt
      }
    });

    // Write log entry
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        details: 'Successful login session started',
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    // Set secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict'
    });

    res.status(200).json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Verify OTP code
export const verifyOTP = async (req, res, next) => {
  const { userId, otp } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User does not exist.' });
    }

    if (!user.otpCode || user.otpCode !== otp || new Date() > user.otpExpiry) {
      return res.status(400).json({ success: false, error: 'Invalid or expired verification code.' });
    }

    // Clear OTP fields
    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpiry: null }
    });

    const token = generateToken(user.id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Save session in database
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        device: req.headers['user-agent'],
        ipAddress: req.ip,
        expiresAt
      }
    });

    // Write login activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'OTP_VERIFICATION',
        details: 'Login OTP verification succeeded',
        ipAddress: req.ip
      }
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict'
    });

    res.status(200).json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    next(error);
  }
};

// 4. User Profile Details
export const getProfile = async (req, res, next) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
};

// 5. Update Profile
export const updateProfile = async (req, res, next) => {
  const { name, phone } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone }
    });

    res.status(200).json({
      success: true,
      message: 'Profile details updated.',
      user: { id: updated.id, name: updated.name, email: updated.email, phone: updated.phone }
    });
  } catch (error) {
    next(error);
  }
};

// 6. User Logout
export const logout = async (req, res, next) => {
  try {
    if (req.token) {
      await prisma.session.deleteMany({
        where: { token: req.token }
      });
    }

    res.clearCookie('token');
    res.status(200).json({ success: true, message: 'Session logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

// 7. Request Password Reset Link
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't leak registered users checking. Return generic success message.
      return res.status(200).json({ success: true, message: 'If registered, a reset email has been sent.' });
    }

    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'dreaming_tree_luxury_secret_key_2026_jwt_token',
      { expiresIn: '1h' }
    );

    // Save temporary reset session as token
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    await prisma.session.create({
      data: {
        userId: user.id,
        token: resetToken,
        device: 'Password Reset Req',
        expiresAt
      }
    });

    await sendResetEmail(user.email, user.name, resetToken);

    res.status(200).json({
      success: true,
      message: 'If registered, a reset email has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

// 8. Confirm Password Reset
export const resetPassword = async (req, res, next) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dreaming_tree_luxury_secret_key_2026_jwt_token');

    // Confirm session exists in database
    const activeReset = await prisma.session.findUnique({ where: { token } });
    if (!activeReset) {
      return res.status(400).json({ success: false, error: 'Password reset link has already been used or expired.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: decoded.id },
      data: { passwordHash }
    });

    // Delete token session
    await prisma.session.delete({ where: { token } });

    res.status(200).json({ success: true, message: 'Your password has been successfully reset.' });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Invalid or expired reset link.' });
  }
};

// 9. Newsletter Registration
export const registerNewsletter = async (req, res, next) => {
  const { email } = req.body;

  try {
    const existing = await prisma.subscriber.findUnique({ where: { email } });
    if (existing) {
      return res.status(200).json({ success: true, message: 'Email already subscribed.' });
    }

    await prisma.subscriber.create({
      data: { email }
    });

    res.status(201).json({ success: true, message: 'Successfully subscribed to newsletter.' });
  } catch (error) {
    next(error);
  }
};
