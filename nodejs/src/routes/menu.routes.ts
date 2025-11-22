import express from 'express';
import { authenticate, requireRestaurant } from '../middleware/auth';
import { getMenu, createCategory, deleteCategory, createItem, updateItem, deleteItem } from '../controllers/menu.controller';

const router = express.Router();

router.get('/', getMenu);
router.post('/categories', authenticate, requireRestaurant, createCategory);
router.delete('/categories/:id', authenticate, requireRestaurant, deleteCategory);
router.post('/items', authenticate, requireRestaurant, createItem);
router.put('/items/:id', authenticate, requireRestaurant, updateItem);
router.delete('/items/:id', authenticate, requireRestaurant, deleteItem);

export default router;

