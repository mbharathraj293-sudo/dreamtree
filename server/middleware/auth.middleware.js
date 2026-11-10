import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import logger from '../utils/logger.js';

export const protect = async (req, res, next) => {
  let token;

  // Retrieve token from Authorization header or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers.cookie) {
    // Basic parser for JWT cookie if set
    const jwtCookie = req.headers.cookie
      .split('; ')
      .find(row => row.startsWith('token='));
    if (jwtCookie) {
      token = jwtCookie.split('=')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access denied. No session token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dreaming_tree_luxury_secret_key_2026_jwt_token');

    // Fetch user and make sure session exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'User associated with this session token no longer exists.' });
    }

    // Verify session in active database sessions list (prevents token reuse after logout)
    const sessionActive = await prisma.session.findUnique({
      where: { token }
    });

    if (!sessionActive || new Date() > sessionActive.expiresAt) {
      return res.status(401).json({ success: false, error: 'Session has expired or was logged out.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    logger.warn(`Token validation failed: ${error.message}`);
    return res.status(401).json({ success: false, error: 'Invalid or expired authentication token.' });
  }
};
