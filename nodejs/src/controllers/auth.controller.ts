import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { JWTPayload, UserRole } from '../types';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email и пароль обязательны' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND is_blocked = FALSE LIMIT 1',
      [email]
    );

    const users = rows as any[];
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Неверный email или пароль' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Неверный email или пароль' });
    }

    if (user.role === UserRole.ADMIN || user.role === UserRole.STAFF) {
      const [restaurantRows] = await pool.execute(
        'SELECT is_active FROM restaurants WHERE id = ? LIMIT 1',
        [user.restaurant_id]
      );
      const restaurants = restaurantRows as any[];
      
      if (restaurants.length === 0 || !restaurants[0].is_active) {
        return res.status(403).json({ success: false, message: 'Ресторан заблокирован' });
      }
    }

    const jwtSecret: string = process.env.JWT_SECRET || 'secret';
    const jwtExpiresIn: string | number = process.env.JWT_EXPIRES_IN || '7d';
    
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurant_id
    };
    
    const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn } as jwt.SignOptions);

    let redirectUrl = '/';
    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        redirectUrl = '/dashboard/super-admin';
        break;
      case UserRole.ADMIN:
        redirectUrl = '/dashboard/admin';
        break;
      case UserRole.STAFF:
        redirectUrl = '/dashboard/staff';
        break;
    }

    res.json({
      success: true,
      message: 'Вход выполнен успешно',
      token,
      redirect: redirectUrl,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        restaurant_id: user.restaurant_id,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка сервера',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const [rows] = await pool.execute(
      'SELECT id, email, role, restaurant_id, first_name, last_name FROM users WHERE id = ? LIMIT 1',
      [req.user.userId]
    );

    const users = rows as any[];
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: users[0] });
  } catch (error: any) {
    console.error('Me error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Выход выполнен успешно' });
};

