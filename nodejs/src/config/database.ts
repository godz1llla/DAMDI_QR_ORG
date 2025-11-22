import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'damdi_qr',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Установить кодировку UTF-8 для всех новых соединений
pool.on('connection', async (connection) => {
  try {
    await connection.query('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
    await connection.query('SET CHARACTER SET utf8mb4');
    await connection.query('SET character_set_connection=utf8mb4');
    await connection.query('SET character_set_results=utf8mb4');
  } catch (err) {
    console.error('Error setting charset on connection:', err);
  }
});

export default pool;

