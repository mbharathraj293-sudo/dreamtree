import express from 'express';
import {
  createReservation,
  getReservations,
  updateStatus,
  deleteReservation
} from '../controllers/reservation.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

// Public booking request creation
router.post('/', createReservation);

// Admin/Staff management actions
router.get('/', protect, authorize('SUPERADMIN', 'ADMIN', 'STAFF'), getReservations);
router.put('/:id', protect, authorize('SUPERADMIN', 'ADMIN', 'STAFF'), updateStatus);
router.delete('/:id', protect, authorize('SUPERADMIN', 'ADMIN'), deleteReservation);

export default router;
