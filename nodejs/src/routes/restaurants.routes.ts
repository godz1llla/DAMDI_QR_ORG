import express from 'express';
import { authenticate, requireRole, requireRestaurant } from '../middleware/auth';
import { createRestaurant, listRestaurants, getMyRestaurant, updateMyRestaurant, getLimits, getStats, updateRestaurant, deleteRestaurant } from '../controllers/restaurants.controller';
import { UserRole } from '../types';

const router = express.Router();

router.post('/', authenticate, requireRole(UserRole.SUPER_ADMIN), createRestaurant);
router.get('/', authenticate, requireRole(UserRole.SUPER_ADMIN), listRestaurants);
router.get('/stats', authenticate, requireRole(UserRole.SUPER_ADMIN), getStats);
router.put('/:id', authenticate, requireRole(UserRole.SUPER_ADMIN), updateRestaurant);
router.delete('/:id', authenticate, requireRole(UserRole.SUPER_ADMIN), deleteRestaurant);
router.get('/my', authenticate, requireRestaurant, getMyRestaurant);
router.put('/my', authenticate, requireRestaurant, updateMyRestaurant);
router.get('/limits', authenticate, requireRestaurant, getLimits);

export default router;

