import express from 'express';
import { authenticate, requireRole, requireRestaurant } from '../middleware/auth';
import { createRestaurant, listRestaurants, getMyRestaurant, updateMyRestaurant, getLimits, getStats, updateRestaurant, deleteRestaurant } from '../controllers/restaurants.controller';
import { UserRole } from '../types';

const router = express.Router();

// Логирование всех запросов к роуту restaurants
router.use((req, res, next) => {
  console.log(`[RESTAURANTS ROUTE] ${req.method} ${req.path}`, {
    url: req.url,
    originalUrl: req.originalUrl,
    method: req.method
  });
  next();
});

router.post('/', authenticate, requireRole(UserRole.SUPER_ADMIN), createRestaurant);
router.get('/', authenticate, requireRole(UserRole.SUPER_ADMIN), listRestaurants);
router.get('/stats', authenticate, requireRole(UserRole.SUPER_ADMIN), getStats);

// ВАЖНО: точные роуты (/my, /limits) ДОЛЖНЫ быть ПЕРЕД параметрическими (/:id)
router.get('/my', authenticate, requireRestaurant, getMyRestaurant);
router.put('/my', authenticate, updateMyRestaurant);
router.get('/limits', authenticate, requireRestaurant, getLimits);

// Параметрические роуты идут ПОСЛЕ точных
router.put('/:id', authenticate, requireRole(UserRole.SUPER_ADMIN), updateRestaurant);
router.delete('/:id', authenticate, requireRole(UserRole.SUPER_ADMIN), deleteRestaurant);

export default router;

