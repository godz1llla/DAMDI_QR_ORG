import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { UserRole } from '../types';

export const listStaff = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(403).json({ success: false, message: 'Restaurant access required' });
    }

    const [rows] = await pool.execute(
      'SELECT id, email, role, first_name, last_name, created_at FROM users WHERE restaurant_id = ? AND role = ? ORDER BY created_at DESC',
      [req.user.restaurantId, UserRole.STAFF]
    );

    res.json({ success: true, staff: rows });
  } catch (error: any) {
    console.error('List staff error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const createStaff = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(403).json({ success: false, message: 'Restaurant access required' });
    }

    const { email, password, first_name, last_name } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ success: false, message: 'Все поля обязательны' });
    }

    const [existingRows] = await pool.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if ((existingRows as any[]).length > 0) {
      return res.status(400).json({ success: false, message: 'Email уже используется' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, role, restaurant_id, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)',
      [email, passwordHash, UserRole.STAFF, req.user.restaurantId, first_name, last_name]
    );

    res.json({
      success: true,
      message: 'Сотрудник успешно добавлен',
      staff_id: (result as any).insertId
    });
  } catch (error: any) {
    console.error('Create staff error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const deleteStaff = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(403).json({ success: false, message: 'Restaurant access required' });
    }

    const staffId = parseInt(req.params.id);

    await pool.execute(
      'DELETE FROM users WHERE id = ? AND restaurant_id = ? AND role = ?',
      [staffId, req.user.restaurantId, UserRole.STAFF]
    );

    res.json({ success: true, message: 'Сотрудник удален' });
  } catch (error: any) {
    console.error('Delete staff error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

