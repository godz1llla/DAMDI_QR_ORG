import { Request, Response } from 'express';
import pool from '../config/database';
import { getCategoryLimit } from '../utils/tariff-limits';

export const getMenu = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.user?.restaurantId || parseInt(req.query.restaurant_id as string);

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'ID ресторана обязателен' });
    }

    const [categoryRows] = await pool.execute(
      'SELECT * FROM menu_categories WHERE restaurant_id = ? AND is_active = TRUE ORDER BY sort_order ASC, name ASC',
      [restaurantId]
    );

    const [itemRows] = await pool.execute(
      'SELECT * FROM menu_items WHERE restaurant_id = ? AND is_available = TRUE ORDER BY category_id ASC, sort_order ASC, name ASC',
      [restaurantId]
    );

    const categories = categoryRows as any[];
    const items = itemRows as any[];

    const menu = categories.map(category => ({
      category,
      items: items.filter(item => item.category_id === category.id)
    }));

    const [restaurantRows] = await pool.execute(
      'SELECT plan FROM restaurants WHERE id = ?',
      [restaurantId]
    );
    const plan = (restaurantRows as any[])[0]?.plan || 'FREE';

    res.json({
      success: true,
      menu,
      limits: {
        current_categories: categories.length,
        max_categories: getCategoryLimit(plan),
        plan
      }
    });
  } catch (error: any) {
    console.error('Get menu error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(403).json({ success: false, message: 'Restaurant access required' });
    }

    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Название категории обязательно' });
    }

    const [restaurantRows] = await pool.execute(
      'SELECT plan FROM restaurants WHERE id = ?',
      [req.user.restaurantId]
    );
    const plan = (restaurantRows as any[])[0]?.plan || 'FREE';

    const [categoryRows] = await pool.execute(
      'SELECT COUNT(*) as count FROM menu_categories WHERE restaurant_id = ?',
      [req.user.restaurantId]
    );
    const currentCount = (categoryRows as any[])[0].count;
    const maxCount = getCategoryLimit(plan);

    if (currentCount >= maxCount) {
      return res.status(400).json({
        success: false,
        message: 'limit_reached',
        limit_type: 'categories',
        current_count: currentCount,
        limit: maxCount,
        plan
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO menu_categories (restaurant_id, name, sort_order) VALUES (?, ?, 0)',
      [req.user.restaurantId, name]
    );

    res.json({
      success: true,
      message: 'Категория создана',
      category_id: (result as any).insertId
    });
  } catch (error: any) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(403).json({ success: false, message: 'Restaurant access required' });
    }

    const categoryId = parseInt(req.params.id);

    await pool.execute(
      'DELETE FROM menu_categories WHERE id = ? AND restaurant_id = ?',
      [categoryId, req.user.restaurantId]
    );

    res.json({ success: true, message: 'Категория удалена' });
  } catch (error: any) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const createItem = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(403).json({ success: false, message: 'Restaurant access required' });
    }

    const { category_id, name, description, price, image_url, is_available } = req.body;

    if (!category_id || !name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Все обязательные поля должны быть заполнены' });
    }

    const [result] = await pool.execute(
      'INSERT INTO menu_items (restaurant_id, category_id, name, description, price, image_url, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      [req.user.restaurantId, category_id, name, description || null, price, image_url || null, is_available !== false]
    );

    res.json({
      success: true,
      message: 'Блюдо создано',
      item_id: (result as any).insertId
    });
  } catch (error: any) {
    console.error('Create item error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(403).json({ success: false, message: 'Restaurant access required' });
    }

    const itemId = parseInt(req.params.id);
    const { name, description, price, image_url, is_available, category_id } = req.body;

    await pool.execute(
      'UPDATE menu_items SET name = ?, description = ?, price = ?, image_url = ?, is_available = ?, category_id = ?, updated_at = NOW() WHERE id = ? AND restaurant_id = ?',
      [name, description, price, image_url, is_available, category_id, itemId, req.user.restaurantId]
    );

    res.json({ success: true, message: 'Блюдо обновлено' });
  } catch (error: any) {
    console.error('Update item error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(403).json({ success: false, message: 'Restaurant access required' });
    }

    const itemId = parseInt(req.params.id);

    await pool.execute(
      'DELETE FROM menu_items WHERE id = ? AND restaurant_id = ?',
      [itemId, req.user.restaurantId]
    );

    res.json({ success: true, message: 'Блюдо удалено' });
  } catch (error: any) {
    console.error('Delete item error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

