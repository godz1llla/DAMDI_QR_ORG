# Инструкция по установке Dámdi QR

## Быстрый старт

### Шаг 1: Требования

Убедитесь, что у вас установлено:
- PHP 7.4 или выше
- MySQL 5.7 или выше
- Apache/Nginx
- Расширение PHP GD

Проверка PHP:
```bash
php -v
php -m | grep gd
```

### Шаг 2: Настройка базы данных

1. Войдите в MySQL:
```bash
mysql -u root -p
```

2. Создайте базу данных и импортируйте схему:
```sql
CREATE DATABASE damdi_qr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE damdi_qr;
SOURCE database/schema.sql;
```

Или через командную строку:
```bash
mysql -u root -p damdi_qr < database/schema.sql
```

### Шаг 3: Настройка подключения к БД

Откройте `config/database.php` и измените параметры подключения:

```php
private $host = 'localhost';
private $db_name = 'damdi_qr';
private $username = 'root';          // Ваш пользователь MySQL
private $password = '';              // Ваш пароль MySQL
```

### Шаг 4: Настройка веб-сервера

#### Вариант A: Apache

1. Убедитесь, что модуль `mod_rewrite` включён:
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

2. Файл `.htaccess` уже создан в корне проекта

3. Убедитесь, что в конфигурации Apache разрешён `AllowOverride All` для директории проекта:
```apache
<Directory /path/to/DAMDIQRRR>
    AllowOverride All
    Require all granted
</Directory>
```

#### Вариант B: Nginx

Добавьте в конфигурацию сайта:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/DAMDIQRRR;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    location ~ /\. {
        deny all;
    }
}
```

Перезапустите Nginx:
```bash
sudo systemctl restart nginx
```

### Шаг 5: Настройка прав доступа

```bash
# Для Apache
sudo chown -R www-data:www-data /path/to/DAMDIQRRR
sudo chmod -R 755 /path/to/DAMDIQRRR

# Создание директории для загрузок
mkdir uploads
sudo chmod 755 uploads

# Защита конфигурационных файлов
sudo chmod 644 config/*.php
```

### Шаг 6: Проверка установки

1. Откройте браузер и перейдите на `http://localhost/` или ваш домен
2. Вы должны увидеть главную страницу Dámdi QR
3. Перейдите на `/login.html`
4. Войдите используя демо-аккаунты:

**Супер-администратор:**
- Email: `superadmin@damdiqr.com`
- Пароль: `admin123`

**Владелец ресторана:**
- Email: `admin@demo.com`
- Пароль: `admin123`

**Сотрудник:**
- Email: `staff@demo.com`
- Пароль: `staff123`

## Настройка для production

### 1. Безопасность

В `config/database.php`:
```php
// Используйте надёжный пароль
private $password = 'strong_password_here';
```

### 2. Настройка PHP

В `php.ini`:
```ini
upload_max_filesize = 10M
post_max_size = 10M
max_execution_time = 60
memory_limit = 256M
display_errors = Off
log_errors = On
error_log = /var/log/php/error.log
```

### 3. HTTPS

Настройте SSL сертификат (Let's Encrypt):
```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d your-domain.com
```

### 4. Создание директории для логов

```bash
sudo mkdir -p /var/log/php
sudo chown www-data:www-data /var/log/php
```

## Проверка функционала

### Проверка API

```bash
# Проверка списка меню
curl http://localhost/api/menu/list.php?restaurant_id=1

# Проверка аутентификации
curl -X POST http://localhost/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"admin123"}'
```

### Проверка AJAX Polling

1. Войдите как сотрудник (`staff@demo.com`)
2. Откройте консоль браузера (F12)
3. Вы должны видеть запросы к `/api/orders/poll.php` каждые 5 секунд

## Устранение неполадок

### Проблема: "Access denied for user"
**Решение:** Проверьте логин и пароль в `config/database.php`

### Проблема: "404 Not Found" для API
**Решение:** 
- Apache: Убедитесь что `mod_rewrite` включён
- Nginx: Проверьте конфигурацию location блоков

### Проблема: "Call to undefined function imagecreatefromjpeg"
**Решение:** Установите GD расширение:
```bash
sudo apt install php-gd
sudo systemctl restart apache2
```

### Проблема: Не загружаются изображения
**Решение:** 
```bash
chmod 755 uploads/
chown www-data:www-data uploads/
```

### Проблема: Ошибка подключения к БД
**Решение:**
```bash
# Проверьте статус MySQL
sudo systemctl status mysql

# Проверьте что БД создана
mysql -u root -p -e "SHOW DATABASES;"
```

## Дополнительная настройка

### Изменение интервала polling

В `dashboard/staff.html` найдите:
```javascript
pollingInterval = setInterval(loadOrders, 5000); // 5 секунд
```

Измените `5000` на нужное значение в миллисекундах.

### Настройка размера изображений

В `utils/image-processor.php`:
```php
private $maxFileSize = 10485760;  // 10MB максимум
private $targetSize = 400000;      // 400KB целевой размер
```

### Добавление нового демо-аккаунта

```sql
INSERT INTO users (email, password_hash, role, first_name, last_name) 
VALUES ('newuser@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', 'Имя', 'Фамилия');
```

Примечание: Хеш соответствует паролю `admin123`

## Полезные команды

### Резервное копирование БД
```bash
mysqldump -u root -p damdi_qr > backup_$(date +%Y%m%d).sql
```

### Восстановление БД
```bash
mysql -u root -p damdi_qr < backup_20250101.sql
```

### Просмотр логов Apache
```bash
tail -f /var/log/apache2/error.log
```

### Просмотр логов PHP
```bash
tail -f /var/log/php/error.log
```

## Контакты

При возникновении проблем:
- Email: support@damdiqr.com
- Документация: README.md

