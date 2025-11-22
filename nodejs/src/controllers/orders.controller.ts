import { Request, Response } from 'express';
import pool from '../config/database';
import { OrderStatus, UserRole } from '../types';
import { sendWhatsAppMessage, formatOrderForWhatsApp } from '../utils/whatsapp';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { restaurant_id, table_id, items, order_type, customer_phone, delivery_address } = req.body;

    // Проверка обязательных полей
    if (!restaurant_id || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Обязательные поля: restaurant_id, items' });
    }

    // Для заказа в ресторане нужен table_id, для доставки - адрес и телефон
    const orderType = order_type || 'DINE_IN';
    if (orderType === 'DINE_IN' && !table_id) {
      return res.status(400).json({ success: false, message: 'Для заказа в ресторане требуется table_id' });
    }
    if (orderType === 'DELIVERY') {
      if (!customer_phone || !delivery_address) {
        return res.status(400).json({ success: false, message: 'Для доставки требуются customer_phone и delivery_address' });
      }
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      let totalAmount = 0;

      // Получаем данные о блюдах и считаем сумму
      for (const item of items) {
        const [menuRows] = await connection.execute(
          'SELECT price, name FROM menu_items WHERE id = ? AND restaurant_id = ? AND is_available = TRUE LIMIT 1',
          [item.menu_item_id, restaurant_id]
        );

        const menuItems = menuRows as any[];
        if (menuItems.length === 0) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: 'Некорректный элемент меню' });
        }

        totalAmount += parseFloat(menuItems[0].price.toString()) * item.quantity;
      }

      // Определяем table_id для доставки (можем использовать NULL или создать виртуальный столик)
      const finalTableId = orderType === 'DELIVERY' ? null : table_id;

      // Создаем заказ
      const [orderResult] = await connection.execute(
        'INSERT INTO orders (restaurant_id, table_id, order_type, customer_phone, delivery_address, status, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [restaurant_id, finalTableId, orderType, customer_phone || null, delivery_address || null, OrderStatus.NEW, totalAmount]
      );

      const orderId = (orderResult as any).insertId;
      const orderItems: Array<{ name: string; quantity: number; price: number }> = [];

      // Создаем элементы заказа
      for (const item of items) {
        const [menuRows] = await connection.execute(
          'SELECT price, name FROM menu_items WHERE id = ? LIMIT 1',
          [item.menu_item_id]
        );
        const menuItems = menuRows as any[];
        const price = parseFloat(menuItems[0].price.toString());
        const name = menuItems[0].name;

        await connection.execute(
          'INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.menu_item_id, item.quantity, price, item.notes || null]
        );

        orderItems.push({ name, quantity: item.quantity, price });
      }

      await connection.commit();

      // Получаем WhatsApp номер ресторана и отправляем уведомление
      let tableNumber = null;
      if (finalTableId) {
        const [tableRows] = await connection.execute(
          'SELECT table_number FROM tables WHERE id = ? LIMIT 1',
          [finalTableId]
        );
        const tables = tableRows as any[];
        if (tables.length > 0) {
          tableNumber = tables[0].table_number;
        }
      }

      // Получаем WhatsApp номер ресторана
      const [restaurantRows] = await connection.execute(
        'SELECT whatsapp_number, name FROM restaurants WHERE id = ? LIMIT 1',
        [restaurant_id]
      );
      const restaurants = restaurantRows as any[];
      const restaurant = restaurants[0];

      connection.release();

      // Отправляем WhatsApp уведомление (после освобождения connection)
      if (restaurant && restaurant.whatsapp_number) {
        try {
          console.log('📱 Preparing WhatsApp notification for restaurant:', restaurant.name);
          console.log('📱 WhatsApp number:', restaurant.whatsapp_number);
          
          const orderData = {
            id: orderId,
            order_type: orderType,
            total_amount: totalAmount,
            customer_phone: customer_phone || undefined,
            delivery_address: delivery_address || undefined,
            table_number: tableNumber || undefined,
            items: orderItems
          };

          const whatsappMessage = formatOrderForWhatsApp(orderData);
          console.log('📱 Message formatted, sending...');
          
          const sent = await sendWhatsAppMessage(restaurant.whatsapp_number, whatsappMessage);
          
          if (sent) {
            console.log('✅ WhatsApp notification sent successfully');
          } else {
            console.log('⚠️ WhatsApp notification not sent (check configuration)');
          }
        } catch (whatsappError) {
          // Не прерываем процесс если WhatsApp не отправился
          console.error('❌ Error sending WhatsApp notification:', whatsappError);
        }
      } else {
        console.log('⚠️ No WhatsApp number configured for restaurant:', restaurant?.name || 'unknown');
      }

      res.json({
        success: true,
        message: 'Заказ успешно создан',
        order_id: orderId,
        total_amount: totalAmount,
        whatsapp_number: restaurant?.whatsapp_number || null,
        order_type: orderType,
        items: orderItems,
        customer_phone: customer_phone || null,
        delivery_address: delivery_address || null,
        table_number: tableNumber || null
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
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

    // Для STAFF показываем только заказы в ресторане (DINE_IN), доставка идет только в WhatsApp
    // Для ADMIN показываем все заказы
    const orderTypeFilter = req.user.role === UserRole.STAFF ? "AND o.order_type = 'DINE_IN'" : '';

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
      WHERE o.restaurant_id = ? ${orderTypeFilter}
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

    // Для STAFF показываем только заказы в ресторане (DINE_IN), доставка идет только в WhatsApp
    // Для ADMIN показываем все заказы
    const orderTypeFilter = req.user.role === UserRole.STAFF ? "AND o.order_type = 'DINE_IN'" : '';

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
      WHERE o.restaurant_id = ? AND o.id > ? AND o.status IN ('NEW', 'PREPARING') ${orderTypeFilter}
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

