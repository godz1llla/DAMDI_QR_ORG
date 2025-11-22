-- Добавление полей для онлайн-заказа и доставки

-- Добавляем whatsapp_number в таблицу restaurants
ALTER TABLE restaurants 
ADD COLUMN whatsapp_number VARCHAR(50) NULL AFTER phone;

-- Сначала удаляем внешний ключ для table_id (чтобы разрешить NULL)
ALTER TABLE orders 
DROP FOREIGN KEY orders_ibfk_2;

-- Разрешаем table_id быть NULL (для заказов на доставку)
ALTER TABLE orders 
MODIFY COLUMN table_id INT NULL;

-- Добавляем обратно внешний ключ, но без NOT NULL ограничения
ALTER TABLE orders 
ADD CONSTRAINT orders_ibfk_2 
FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE;

-- Добавляем поля для доставки в таблицу orders
ALTER TABLE orders
ADD COLUMN order_type ENUM('DINE_IN', 'DELIVERY') DEFAULT 'DINE_IN' AFTER table_id,
ADD COLUMN customer_phone VARCHAR(50) NULL AFTER order_type,
ADD COLUMN delivery_address TEXT NULL AFTER customer_phone;

-- Создаем индекс для order_type
CREATE INDEX idx_order_type ON orders(order_type);

