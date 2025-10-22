-- Скрипт для обновления паролей демо-аккаунтов
-- Используйте этот скрипт, если база данных уже создана и нужно обновить только пароли

USE damdi_qr;

-- Обновление пароля для супер-администратора (admin123)
UPDATE users 
SET password_hash = '$2y$10$256PX49ttD5VI/b5YDN4MeM5qOtieUWwEPbptpAMK22Afg9kPUVw.' 
WHERE email = 'superadmin@damdiqr.com';

-- Обновление пароля для владельца ресторана (admin123)
UPDATE users 
SET password_hash = '$2y$10$256PX49ttD5VI/b5YDN4MeM5qOtieUWwEPbptpAMK22Afg9kPUVw.' 
WHERE email = 'admin@demo.com';

-- Обновление пароля для сотрудника (staff123)
UPDATE users 
SET password_hash = '$2y$10$TsLyiQcEQxf.huJA4dxAruC97hswGl6XxoEQ7juSDq3SKeOVJouui' 
WHERE email = 'staff@demo.com';

SELECT 'Пароли успешно обновлены!' as result;

