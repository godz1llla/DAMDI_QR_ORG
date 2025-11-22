import express from 'express';
import authRoutes from './auth.routes';
import restaurantRoutes from './restaurants.routes';
import menuRoutes from './menu.routes';
import tableRoutes from './tables.routes';
import orderRoutes from './orders.routes';
import staffRoutes from './staff.routes';
import qrRoutes from './qr.routes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/menu', menuRoutes);
router.use('/tables', tableRoutes);
router.use('/orders', orderRoutes);
router.use('/staff', staffRoutes);
router.use('/qr', qrRoutes);

export default router;

