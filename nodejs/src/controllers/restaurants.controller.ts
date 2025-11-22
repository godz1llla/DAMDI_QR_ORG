import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { UserRole, RestaurantPlan } from '../types';
import { getTableLimit, getCategoryLimit } from '../utils/tariff-limits';

export const createRestaurant = async (req: Request, res: Response) => {
  try {
    const { restaurant_name, owner_email, owner_password, owner_first_name, owner_last_name, plan, address, phone } = req.body;

    console.log('Create restaurant request:', { restaurant_name, owner_email, owner_first_name, owner_last_name, plan });

    if (!restaurant_name || !owner_email || !owner_password || !owner_first_name || !owner_last_name) {
      return res.status(400).json({ success: false, message: 'Все поля обязательны' });
    }

    // Валидация плана
    const restaurantPlan = (plan && (plan === RestaurantPlan.FREE || plan === RestaurantPlan.PREMIUM)) 
      ? plan 
      : RestaurantPlan.FREE;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [owner_email]
      );

      if ((existingUsers as any[]).length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ success: false, message: 'Email уже используется' });
      }

      const passwordHash = await bcrypt.hash(owner_password, 10);

      const [restaurantResult] = await connection.execute(
        'INSERT INTO restaurants (name, owner_id, plan, address, phone) VALUES (?, NULL, ?, ?, ?)',
        [restaurant_name, restaurantPlan, address || '', phone || '']
      );

      const restaurantId = (restaurantResult as any).insertId;

      const [userResult] = await connection.execute(
        'INSERT INTO users (email, password_hash, role, restaurant_id, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)',
        [owner_email, passwordHash, UserRole.ADMIN, restaurantId, owner_first_name, owner_last_name]
      );

      const ownerId = (userResult as any).insertId;

      await connection.execute(
        'UPDATE restaurants SET owner_id = ? WHERE id = ?',
        [ownerId, restaurantId]
      );

      await connection.commit();
      connection.release();

      console.log('Restaurant created successfully:', { restaurantId, ownerId });

      res.json({
        success: true,
        message: 'Заведение успешно создано',
        restaurant_id: restaurantId
      });
    } catch (error: any) {
      await connection.rollback();
      connection.release();
      console.error('Transaction error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      throw error;
    }
  } catch (error: any) {
    console.error('Create restaurant error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    // Если ошибка связана с SQL, возвращаем более понятное сообщение
    if (error.sqlMessage) {
      return res.status(500).json({ 
        success: false, 
        message: `Ошибка базы данных: ${error.sqlMessage}`,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка сервера',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const listRestaurants = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute(`
      SELECT r.*, u.email as owner_email, u.first_name as owner_first_name, u.last_name as owner_last_name
      FROM restaurants r
      LEFT JOIN users u ON r.owner_id = u.id
      ORDER BY r.created_at DESC
    `);

    res.json({ success: true, restaurants: rows });
  } catch (error: any) {
    console.error('List restaurants error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const getMyRestaurant = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(403).json({ success: false, message: 'Restaurant access required' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM restaurants WHERE id = ? LIMIT 1',
      [req.user.restaurantId]
    );

    const restaurants = rows as any[];
    if (restaurants.length === 0) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const restaurant = restaurants[0];

    const [tableRows] = await pool.execute(
      'SELECT COUNT(*) as count FROM tables WHERE restaurant_id = ?',
      [restaurant.id]
    );
    const tableCount = (tableRows as any[])[0].count;

    const [categoryRows] = await pool.execute(
      'SELECT COUNT(*) as count FROM menu_categories WHERE restaurant_id = ?',
      [restaurant.id]
    );
    const categoryCount = (categoryRows as any[])[0].count;

    res.json({
      success: true,
      restaurant: {
        ...restaurant,
        limits: {
          current_tables: tableCount,
          max_tables: getTableLimit(restaurant.plan),
          current_categories: categoryCount,
          max_categories: getCategoryLimit(restaurant.plan),
          plan: restaurant.plan
        }
      }
    });
  } catch (error: any) {
    console.error('Get my restaurant error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const updateMyRestaurant = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(403).json({ success: false, message: 'Restaurant access required' });
    }

    const { name, address, phone, whatsapp_number } = req.body;

    await pool.execute(
      'UPDATE restaurants SET name = ?, address = ?, phone = ?, whatsapp_number = ?, updated_at = NOW() WHERE id = ?',
      [name, address, phone, whatsapp_number || null, req.user.restaurantId]
    );

    res.json({ success: true, message: 'Ресторан обновлен' });
  } catch (error: any) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const getLimits = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(403).json({ success: false, message: 'Restaurant access required' });
    }

    const [rows] = await pool.execute(
      'SELECT plan FROM restaurants WHERE id = ? LIMIT 1',
      [req.user.restaurantId]
    );

    const restaurants = rows as any[];
    if (restaurants.length === 0) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const plan = restaurants[0].plan;

    const [tableRows] = await pool.execute(
      'SELECT COUNT(*) as count FROM tables WHERE restaurant_id = ?',
      [req.user.restaurantId]
    );
    const tableCount = (tableRows as any[])[0].count;

    const [categoryRows] = await pool.execute(
      'SELECT COUNT(*) as count FROM menu_categories WHERE restaurant_id = ?',
      [req.user.restaurantId]
    );
    const categoryCount = (categoryRows as any[])[0].count;

    res.json({
      success: true,
      limits: {
        tables: {
          current: tableCount,
          max: getTableLimit(plan)
        },
        categories: {
          current: categoryCount,
          max: getCategoryLimit(plan)
        },
        plan
      }
    });
  } catch (error: any) {
    console.error('Get limits error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const [restaurantRows] = await pool.execute('SELECT COUNT(*) as total, SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active, SUM(CASE WHEN plan = ? THEN 1 ELSE 0 END) as premium FROM restaurants', [RestaurantPlan.PREMIUM]);
    const restaurants = restaurantRows as any[];
    const stats = restaurants[0];

    const [orderRows] = await pool.execute('SELECT COUNT(*) as total, COALESCE(SUM(total_amount), 0) as revenue FROM orders');
    const orders = orderRows as any[];
    const orderStats = orders[0];

    res.json({
      success: true,
      stats: {
        total_restaurants: parseInt(stats.total || 0),
        active_restaurants: parseInt(stats.active || 0),
        premium_restaurants: parseInt(stats.premium || 0),
        total_orders: parseInt(orderStats.total || 0),
        total_revenue: parseFloat(orderStats.revenue || 0),
      }
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const updateRestaurant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active, plan } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID ресторана обязателен' });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }

    if (plan) {
      updates.push('plan = ?');
      values.push(plan);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Нет данных для обновления' });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await pool.execute(
      `UPDATE restaurants SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ success: true, message: 'Ресторан обновлен' });
  } catch (error: any) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const deleteRestaurant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID ресторана обязателен' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Удаляем связанные данные
      await connection.execute('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE restaurant_id = ?)', [id]);
      await connection.execute('DELETE FROM orders WHERE restaurant_id = ?', [id]);
      await connection.execute('DELETE FROM menu_items WHERE category_id IN (SELECT id FROM menu_categories WHERE restaurant_id = ?)', [id]);
      await connection.execute('DELETE FROM menu_categories WHERE restaurant_id = ?', [id]);
      await connection.execute('DELETE FROM tables WHERE restaurant_id = ?', [id]);
      await connection.execute('DELETE FROM users WHERE restaurant_id = ?', [id]);
      await connection.execute('DELETE FROM restaurants WHERE id = ?', [id]);

      await connection.commit();
      res.json({ success: true, message: 'Ресторан удален' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

