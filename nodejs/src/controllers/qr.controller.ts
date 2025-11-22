import { Request, Response } from 'express';
import pool from '../config/database';
import { generateQRCode, generateQRWithLabel, generateQRDataUri } from '../utils/qr-generator';

export const generateQR = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(403).json({ success: false, message: 'Restaurant access required' });
    }

    const tableId = parseInt(req.query.table_id as string);

    if (!tableId) {
      return res.status(400).json({ success: false, message: 'Table ID required' });
    }

    const [rows] = await pool.execute(
      'SELECT t.*, r.name as restaurant_name FROM tables t LEFT JOIN restaurants r ON t.restaurant_id = r.id WHERE t.id = ? AND t.restaurant_id = ? LIMIT 1',
      [tableId, req.user.restaurantId]
    );

    const tables = rows as any[];
    if (tables.length === 0) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    const table = tables[0];
    const protocol = req.protocol;
    const host = req.get('host');
    const menuUrl = `${protocol}://${host}/menu/client.html?restaurant_id=${req.user.restaurantId}&table_id=${tableId}`;

    const label = `${table.restaurant_name} - Столик №${table.table_number}`;
    const qrBuffer = await generateQRWithLabel(menuUrl, label, 300);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="qr-table-${table.table_number}.png"`);
    res.send(qrBuffer);
  } catch (error: any) {
    console.error('Generate QR error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

export const previewQR = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(403).json({ success: false, message: 'Restaurant access required' });
    }

    const tableId = parseInt(req.query.table_id as string);

    if (!tableId) {
      return res.status(400).json({ success: false, message: 'Table ID required' });
    }

    const [rows] = await pool.execute(
      'SELECT t.*, r.name as restaurant_name FROM tables t LEFT JOIN restaurants r ON t.restaurant_id = r.id WHERE t.id = ? AND t.restaurant_id = ? LIMIT 1',
      [tableId, req.user.restaurantId]
    );

    const tables = rows as any[];
    if (tables.length === 0) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    const table = tables[0];
    const protocol = req.protocol;
    const host = req.get('host');
    const menuUrl = `${protocol}://${host}/menu/client.html?restaurant_id=${req.user.restaurantId}&table_id=${tableId}`;

    const qrDataUri = await generateQRDataUri(menuUrl, 300);

    res.json({
      success: true,
      qr_code: qrDataUri,
      menu_url: menuUrl,
      table_number: table.table_number,
      restaurant_name: table.restaurant_name
    });
  } catch (error: any) {
    console.error('Preview QR error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

