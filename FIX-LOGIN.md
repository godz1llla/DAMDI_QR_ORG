# Исправление проблемы с входом

Если вы не можете войти с демо-аккаунтами, это означает, что хеши паролей в базе данных неправильные.

## Быстрое решение

### Вариант 1: Обновить только пароли (если база уже создана)

```bash
mysql -u root -p damdi_qr < database/fix-passwords.sql
```

### Вариант 2: Пересоздать базу данных полностью

```bash
# Удалить старую базу
mysql -u root -p -e "DROP DATABASE IF EXISTS damdi_qr;"

# Создать заново
mysql -u root -p < database/schema.sql
```

## Проверка

После выполнения одного из вариантов, попробуйте войти:

**Супер-администратор:**
- Email: `superadmin@damdiqr.com`
- Пароль: `admin123`

**Владелец ресторана:**
- Email: `admin@demo.com`
- Пароль: `admin123`

**Сотрудник:**
- Email: `staff@demo.com`
- Пароль: `staff123`

## Если всё ещё не работает

### 1. Проверьте подключение к базе данных

Откройте `config/database.php` и убедитесь, что параметры правильные:
```php
private $host = 'localhost';
private $db_name = 'damdi_qr';
private $username = 'root';      // ваш логин MySQL
private $password = '';          // ваш пароль MySQL
```

### 2. Проверьте что база данных существует

```bash
mysql -u root -p -e "SHOW DATABASES LIKE 'damdi_qr';"
```

Должно показать:
```
+----------------------+
| Database (damdi_qr)  |
+----------------------+
| damdi_qr             |
+----------------------+
```

### 3. Проверьте что пользователи созданы

```bash
mysql -u root -p damdi_qr -e "SELECT email, role FROM users;"
```

Должно показать:
```
+--------------------------+-------------+
| email                    | role        |
+--------------------------+-------------+
| superadmin@damdiqr.com   | SUPER_ADMIN |
| admin@demo.com           | ADMIN       |
| staff@demo.com           | STAFF       |
+--------------------------+-------------+
```

### 4. Проверьте консоль браузера

1. Откройте страницу входа
2. Нажмите F12 для открытия Developer Tools
3. Перейдите на вкладку "Console"
4. Попробуйте войти
5. Посмотрите есть ли ошибки в консоли

Типичные ошибки:
- **404 Not Found** на `/api/auth/login.php` - проблема с настройкой веб-сервера
- **CORS error** - проблема с настройкой заголовков
- **Connection refused** - PHP или веб-сервер не запущен

### 5. Проверьте что PHP работает

Создайте файл `test.php` в корне проекта:
```php
<?php
phpinfo();
?>
```

Откройте `http://localhost/test.php` в браузере.
Если видите информацию о PHP - значит PHP работает.

### 6. Проверьте права доступа

```bash
# В директории проекта
ls -la config/
ls -la api/

# Должно быть что-то вроде:
# -rw-r--r-- для файлов
# drwxr-xr-x для папок
```

### 7. Проверьте логи

Apache:
```bash
tail -f /var/log/apache2/error.log
```

Nginx:
```bash
tail -f /var/log/nginx/error.log
```

PHP:
```bash
tail -f /var/log/php/error.log
```

## Ручное создание пользователя для теста

Если ничего не помогает, создайте тестового пользователя вручную:

```bash
mysql -u root -p damdi_qr
```

```sql
-- Удалить старого пользователя если есть
DELETE FROM users WHERE email = 'test@test.com';

-- Создать нового с паролем "test123"
INSERT INTO users (email, password_hash, role, first_name, last_name) 
VALUES (
    'test@test.com', 
    '$2y$10$256PX49ttD5VI/b5YDN4MeM5qOtieUWwEPbptpAMK22Afg9kPUVw.',
    'SUPER_ADMIN', 
    'Test', 
    'User'
);
```

Попробуйте войти с:
- Email: `test@test.com`
- Пароль: `test123` (используется тот же хеш что и для admin123)

## Нужна помощь?

Если проблема всё ещё не решена, создайте issue с:
1. Версией PHP (`php -v`)
2. Версией MySQL (`mysql --version`)
3. Логами из консоли браузера
4. Логами из PHP/Apache/Nginx

