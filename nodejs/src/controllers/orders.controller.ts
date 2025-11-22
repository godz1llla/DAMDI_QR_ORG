import { Request, Response } from 'express';
import pool from '../config/database';
import { OrderStatus, UserRole } from '../types';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { restaurant_id, table_id, items } = req.body;

    if (!restaurant_id || !table_id || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Обязательные поля: restaurant_id, table_id, items' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      let totalAmount = 0;

      for (const item of items) {
        const [menuRows] = await connection.execute(
          'SELECT price FROM menu_items WHERE id = ? AND restaurant_id = ? AND is_available = TRUE LIMIT 1',
          [item.menu_item_id, restaurant_id]
        );

        const menuItems = menuRows as any[];
        if (menuItems.length === 0) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: 'Некорректный элемент меню' });
        }

        totalAmount += menuItems[0].price * item.quantity;
      }

      const [orderResult] = await connection.execute(
        'INSERT INTO orders (restaurant_id, table_id, status, total_amount) VALUES (?, ?, ?, ?)',
        [restaurant_id, table_id, OrderStatus.NEW, totalAmount]
      );

      const orderId = (orderResult as any).insertId;

      for (const item of items) {
        const [menuRows] = await connection.execute(
          'SELECT price FROM menu_items WHERE id = ? LIMIT 1',
          [item.menu_item_id]
        );
        const menuItems = menuRows as any[];
        const price = menuItems[0].price;

        await connection.execute(
          'INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.menu_item_id, item.quantity, price, item.notes || null]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Заказ успешно создан',
        order_id: orderId,
        total_amount: totalAmount
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const listOrders = async (req: Request, res: Response) => {
  try {
    // Для SUPER_ADMIN возвращаем все заказы
    if (req.user && req.user.role === UserRole.SUPER_ADMIN) {
      const [rows] = await pool.execute(`
        SELECT o.*, t.table_number,
               GROUP_CONCAT(
                 CONCAT(mi.name, ' x', oi.quantity, ' = ', oi.price * oi.quantity, ' ₸')
                 SEPARATOR ', '
               ) as items_summary
        FROM orders o
        LEFT JOIN tables t ON o.table_id = t.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT 100
      `);

      // Получаем items для каждого заказа
      const orders = rows as any[];
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const [itemRows] = await pool.execute(
            `SELECT oi.*, mi.name, mi.description
             FROM order_items oi
             LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
             WHERE oi.order_id = ?`,
            [order.id]
          );
          return {
            ...order,
            items: itemRows,
          };
        })
      );

      return res.json({ success: true, orders: ordersWithItems });
    }

    // Для ADMIN и STAFF возвращаем заказы их ресторана
    if (!req.user || !req.user.restaurantId) {
      return res.status(403).json({ success: false, message: 'Restaurant access required' });
    }

    const [rows] = await pool.execute(`
      SELECT o.*, t.table_number,
             GROUP_CONCAT(
               CONCAT(mi.name, ' x', oi.quantity, ' = ', oi.price * oi.quantity, ' ₸')
               SEPARATOR ', '
             ) as items_summary
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.restaurant_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 100
    `, [req.user.restaurantId]);

    // Получаем items для каждого заказа
    const orders = rows as any[];
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [itemRows] = await pool.execute(
          `SELECT oi.*, mi.name, mi.description
           FROM order_items oi
           LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
           WHERE oi.order_id = ?`,
          [order.id]
        );
        return {
          ...order,
          items: itemRows,
        };
      })
    );

    res.json({ success: true, orders: ordersWithItems });
  } catch (error: any) {
    console.error('List orders error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const pollOrders = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(403).json({ success: false, message: 'Restaurant access required' });
    }

    const lastId = parseInt(req.query.last_id as string) || 0;

    const [rows] = await pool.execute(`
      SELECT o.*, t.table_number,
             GROUP_CONCAT(
               CONCAT(mi.name, ' x', oi.quantity)
               SEPARATOR ', '
             ) as items_summary
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.restaurant_id = ? AND o.id > ? AND o.status IN ('NEW', 'PREPARING')
      GROUP BY o.id
      ORDER BY o.created_at ASC
    `, [req.user.restaurantId, lastId]);

    res.json({ success: true, orders: rows });
  } catch (error: any) {
    console.error('Poll orders error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(403).json({ success: false, message: 'Restaurant access required' });
    }

    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    if (!Object.values(OrderStatus).includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    await pool.execute(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ? AND restaurant_id = ?',
      [status, orderId, req.user.restaurantId]
    );

    res.json({ success: true, message: 'Статус заказа обновлен' });
  } catch (error: any) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const getOrderStats = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(403).json({ success: false, message: 'Restaurant access required' });
    }

    const [todayRows] = await pool.execute(`
      SELECT COUNT(*) as count, SUM(total_amount) as total
      FROM orders
      WHERE restaurant_id = ? AND DATE(created_at) = CURDATE()
    `, [req.user.restaurantId]);

    const [monthRows] = await pool.execute(`
      SELECT COUNT(*) as count, SUM(total_amount) as total
      FROM orders
      WHERE restaurant_id = ? AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())
    `, [req.user.restaurantId]);

    res.json({
      success: true,
      stats: {
        today: (todayRows as any[])[0],
        month: (monthRows as any[])[0]
      }
    });
  } catch (error: any) {
    console.error('Get order stats error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

