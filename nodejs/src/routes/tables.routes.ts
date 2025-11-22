import express from 'express';
import { authenticate, requireRestaurant } from '../middleware/auth';
import { listTables, createTable, deleteTable } from '../controllers/tables.controller';

const router = express.Router();

router.get('/', authenticate, requireRestaurant, listTables);
router.post('/', authenticate, requireRestaurant, createTable);
router.delete('/:id', authenticate, requireRestaurant, deleteTable);

export default router;

