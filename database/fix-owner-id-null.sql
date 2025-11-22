-- Исправление: разрешить NULL для owner_id в таблице restaurants
-- Это необходимо, так как при создании ресторана сначала создается ресторан с NULL owner_id,
-- затем создается пользователь, а затем owner_id обновляется

USE damdi_qr;

-- Временно отключаем проверку foreign key для изменения колонки
SET FOREIGN_KEY_CHECKS = 0;

-- Изменяем колонку owner_id, чтобы разрешить NULL
ALTER TABLE restaurants MODIFY COLUMN owner_id INT NULL;

-- Включаем обратно проверку foreign key
SET FOREIGN_KEY_CHECKS = 1;

-- Проверка
SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'damdi_qr' 
  AND TABLE_NAME = 'restaurants' 
  AND COLUMN_NAME = 'owner_id';

