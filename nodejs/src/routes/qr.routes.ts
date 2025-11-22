import express from 'express';
import { authenticate, requireRestaurant } from '../middleware/auth';
import { generateQR, previewQR } from '../controllers/qr.controller';

const router = express.Router();

router.get('/generate', authenticate, requireRestaurant, generateQR);
router.get('/preview', authenticate, requireRestaurant, previewQR);

export default router;

