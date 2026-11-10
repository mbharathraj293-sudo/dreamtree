import express from 'express';
import authRoutes from './auth.routes.js';
import reservationRoutes from './reservation.routes.js';
import menuRoutes from './menu.routes.js';
import analyticsRoutes from './analytics.routes.js';
import settingRoutes from './setting.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/reservations', reservationRoutes);
router.use('/menu', menuRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/settings', settingRoutes);

export default router;
