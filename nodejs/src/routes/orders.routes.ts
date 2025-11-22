import express from 'express';
import { authenticate, requireRestaurant, requireRole } from '../middleware/auth';
import { createOrder, listOrders, pollOrders, updateOrderStatus, getOrderStats } from '../controllers/orders.controller';
import { UserRole } from '../types';

const router = express.Router();

router.post('/', createOrder);
// Для SUPER_ADMIN доступ без restaurantId, для других требуется
router.get('/', authenticate, (req, res, next) => {
  if (req.user && req.user.role === UserRole.SUPER_ADMIN) {
    return next();
  }
  requireRestaurant(req, res, next);
}, listOrders);
router.get('/poll', authenticate, requireRestaurant, pollOrders);
router.put('/:id/status', authenticate, requireRestaurant, updateOrderStatus);
router.get('/stats', authenticate, requireRestaurant, getOrderStats);

export default router;

