import { Request, Response } from 'express';
import pool from '../config/database';
import { getTableLimit } from '../utils/tariff-limits';

export const listTables = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(403).json({ success: false, message: 'Restaurant access required' });
    }

    const [rows] = await pool.execute(
      'SELECT t.*, r.name as restaurant_name FROM tables t LEFT JOIN restaurants r ON t.restaurant_id = r.id WHERE t.restaurant_id = ? ORDER BY t.table_number ASC',
      [req.user.restaurantId]
    );

    const [restaurantRows] = await pool.execute(
      'SELECT plan FROM restaurants WHERE id = ?',
      [req.user.restaurantId]
    );
    const plan = (restaurantRows as any[])[0]?.plan || 'FREE';

    const tables = rows as any[];
    const maxTables = getTableLimit(plan);

    res.json({
      success: true,
      tables,
      limits: {
        current: tables.length,
        max: maxTables,
        plan
      }
    });
  } catch (error: any) {
    console.error('List tables error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const createTable = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(403).json({ success: false, message: 'Restaurant access required' });
    }

    const { table_number } = req.body;

    if (!table_number) {
      return res.status(400).json({ success: false, message: 'Номер столика обязателен' });
    }

    const [restaurantRows] = await pool.execute(
      'SELECT plan FROM restaurants WHERE id = ?',
      [req.user.restaurantId]
    );
    const plan = (restaurantRows as any[])[0]?.plan || 'FREE';

    const [tableRows] = await pool.execute(
      'SELECT COUNT(*) as count FROM tables WHERE restaurant_id = ?',
      [req.user.restaurantId]
    );
    const currentCount = (tableRows as any[])[0].count;
    const maxCount = getTableLimit(plan);

    if (currentCount >= maxCount) {
      return res.status(400).json({
        success: false,
        message: 'limit_reached',
        limit_type: 'tables',
        current_count: currentCount,
        limit: maxCount,
        plan
      });
    }

    const [existingRows] = await pool.execute(
      'SELECT id FROM tables WHERE restaurant_id = ? AND table_number = ?',
      [req.user.restaurantId, table_number]
    );

    if ((existingRows as any[]).length > 0) {
      return res.status(400).json({ success: false, message: 'Столик с таким номером уже существует' });
    }

    const [result] = await pool.execute(
      'INSERT INTO tables (restaurant_id, table_number, is_active) VALUES (?, ?, TRUE)',
      [req.user.restaurantId, table_number]
    );

    res.json({
      success: true,
      message: 'Столик создан',
      table_id: (result as any).insertId
    });
  } catch (error: any) {
    console.error('Create table error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const deleteTable = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(403).json({ success: false, message: 'Restaurant access required' });
    }

    const tableId = parseInt(req.params.id);

    await pool.execute(
      'DELETE FROM tables WHERE id = ? AND restaurant_id = ?',
      [tableId, req.user.restaurantId]
    );

    res.json({ success: true, message: 'Столик удален' });
  } catch (error: any) {
    console.error('Delete table error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

