-- Исправление кодировки для существующих данных
-- Этот скрипт перекодирует данные из latin1 в utf8mb4

USE damdi_qr;

-- Обновить все текстовые поля в menu_items
UPDATE menu_items 
SET 
  name = CONVERT(CAST(CONVERT(name USING latin1) AS BINARY) USING utf8mb4),
  description = CASE 
    WHEN description IS NOT NULL 
    THEN CONVERT(CAST(CONVERT(description USING latin1) AS BINARY) USING utf8mb4)
    ELSE NULL
  END;

-- Обновить все текстовые поля в menu_categories
UPDATE menu_categories 
SET name = CONVERT(CAST(CONVERT(name USING latin1) AS BINARY) USING utf8mb4);

-- Обновить все текстовые поля в restaurants
UPDATE restaurants 
SET 
  name = CONVERT(CAST(CONVERT(name USING latin1) AS BINARY) USING utf8mb4),
  address = CASE 
    WHEN address IS NOT NULL 
    THEN CONVERT(CAST(CONVERT(address USING latin1) AS BINARY) USING utf8mb4)
    ELSE NULL
  END;

-- Обновить все текстовые поля в users
UPDATE users 
SET 
  first_name = CONVERT(CAST(CONVERT(first_name USING latin1) AS BINARY) USING utf8mb4),
  last_name = CONVERT(CAST(CONVERT(last_name USING latin1) AS BINARY) USING utf8mb4);

-- Проверка
SELECT name, description FROM menu_items LIMIT 5;

