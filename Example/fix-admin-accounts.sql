-- Скрипт для исправления проблем с админ-аккаунтами
-- Запустите этот скрипт если у вас проблемы со входом в созданные заведения

USE damdi_qr;

-- Показываем проблемные записи
SELECT 'Проблемные пользователи ADMIN:' as info;
SELECT u.id, u.email, u.role, u.restaurant_id, u.is_blocked,
       r.id as restaurant_exists, r.name, r.is_active as restaurant_active
FROM users u 
LEFT JOIN restaurants r ON u.restaurant_id = r.id 
WHERE u.role = 'ADMIN';

-- Показываем проблемные рестораны
SELECT 'Проблемные рестораны:' as info;
SELECT r.id, r.name, r.owner_id, r.is_active,
       u.id as owner_exists, u.email, u.role as owner_role
FROM restaurants r 
LEFT JOIN users u ON r.owner_id = u.id;

-- Исправляем пользователей без restaurant_id
UPDATE users 
SET restaurant_id = (SELECT id FROM restaurants WHERE owner_id = users.id LIMIT 1)
WHERE role = 'ADMIN' AND restaurant_id IS NULL;

-- Исправляем рестораны без owner_id
UPDATE restaurants 
SET owner_id = (SELECT id FROM users WHERE restaurant_id = restaurants.id AND role = 'ADMIN' LIMIT 1)
WHERE owner_id IS NULL;

-- Убеждаемся что все рестораны активны
UPDATE restaurants SET is_active = TRUE WHERE is_active IS NULL OR is_active = FALSE;

-- Показываем исправленные записи
SELECT 'Исправленные пользователи ADMIN:' as info;
SELECT u.id, u.email, u.role, u.restaurant_id, u.is_blocked,
       r.id as restaurant_exists, r.name, r.is_active as restaurant_active
FROM users u 
LEFT JOIN restaurants r ON u.restaurant_id = r.id 
WHERE u.role = 'ADMIN';

SELECT 'Исправленные рестораны:' as info;
SELECT r.id, r.name, r.owner_id, r.is_active,
       u.id as owner_exists, u.email, u.role as owner_role
FROM restaurants r 
LEFT JOIN users u ON r.owner_id = u.id;
