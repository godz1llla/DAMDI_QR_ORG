import express from 'express';
import { authenticate, requireRestaurant } from '../middleware/auth';
import { listStaff, createStaff, deleteStaff } from '../controllers/staff.controller';

const router = express.Router();

router.get('/', authenticate, requireRestaurant, listStaff);
router.post('/', authenticate, requireRestaurant, createStaff);
router.delete('/:id', authenticate, requireRestaurant, deleteStaff);

export default router;

