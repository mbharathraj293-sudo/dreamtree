import express from 'express';
import { getDashboardStats, getActivityLogs } from '../controllers/analytics.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

router.get('/stats', protect, authorize('SUPERADMIN', 'ADMIN', 'STAFF'), getDashboardStats);
router.get('/logs', protect, authorize('SUPERADMIN', 'ADMIN'), getActivityLogs);

export default router;
