import express from 'express';
import {
  getMenu,
  getCategories,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createCategory,
  deleteCategory
} from '../controllers/menu.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

// Public listing endpoints
router.get('/', getMenu);
router.get('/categories', getCategories);

// Admin-only management endpoints
router.post('/', protect, authorize('SUPERADMIN', 'ADMIN'), createMenuItem);
router.put('/:id', protect, authorize('SUPERADMIN', 'ADMIN'), updateMenuItem);
router.delete('/:id', protect, authorize('SUPERADMIN', 'ADMIN'), deleteMenuItem);

router.post('/categories', protect, authorize('SUPERADMIN', 'ADMIN'), createCategory);
router.delete('/categories/:id', protect, authorize('SUPERADMIN', 'ADMIN'), deleteCategory);

export default router;
