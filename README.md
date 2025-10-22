# Dámdi QR - Система управления цифровыми QR-меню для ресторанов

## Описание

Dámdi QR - это полнофункциональная SaaS-платформа для управления цифровыми меню и заказами в ресторанах через QR-коды.

## Технологии

- **Backend**: Vanilla PHP (без фреймворков)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **База данных**: MySQL
- **Обработка изображений**: PHP GD (конвертация в WebP)

## Структура проекта

```
DAMDIQRRR/
├── index.html                  # Главная страница (лендинг)
├── login.html                  # Страница входа
├── config/                     # Конфигурация
│   ├── database.php           # Подключение к БД
│   └── session.php            # Управление сеансами
├── api/                        # REST API endpoints
│   ├── auth/                  # Аутентификация
│   │   ├── login.php
│   │   ├── logout.php
│   │   └── me.php
│   ├── restaurants/           # Управление заведениями
│   │   ├── list.php
│   │   ├── create.php
│   │   ├── update.php
│   │   ├── delete.php
│   │   └── stats.php
│   ├── orders/                # Управление заказами
│   │   ├── list.php
│   │   ├── update-status.php
│   │   └── poll.php           # AJAX Polling endpoint
│   ├── menu/                  # Управление меню
│   │   ├── list.php
│   │   ├── create-item.php
│   │   ├── update-item.php
│   │   └── delete-item.php
│   └── upload/                # Загрузка файлов
│       └── image.php
├── dashboard/                  # Панели управления
│   ├── super-admin.html       # Панель супер-администратора
│   ├── admin.html             # Панель владельца ресторана
│   └── staff.html             # Доска заказов для сотрудников
├── menu/                       # Клиентское меню
│   └── client.html            # Мобильное меню для гостей
├── database/                   # База данных
│   └── schema.sql             # SQL схема и демо-данные
└── utils/                      # Утилиты
    └── image-processor.php    # Обработка изображений

```

## Установка

### 1. Требования

- PHP 7.4+
- MySQL 5.7+
- Apache/Nginx с mod_rewrite
- GD библиотека для PHP

### 2. Настройка базы данных

1. Создайте базу данных MySQL:
```bash
mysql -u root -p
```

2. Импортируйте схему:
```bash
mysql -u root -p < database/schema.sql
```

3. Отредактируйте `config/database.php` и укажите ваши данные подключения:
```php
private $host = 'localhost';
private $db_name = 'damdi_qr';
private $username = 'root';
private $password = '';
```

### 3. Настройка веб-сервера

#### Apache (.htaccess)

Создайте файл `.htaccess` в корне проекта:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/$1 [L]
```

#### Nginx

Добавьте в конфигурацию:

```nginx
location /api/ {
    try_files $uri $uri/ =404;
}

location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    fastcgi_index index.php;
    include fastcgi_params;
}
```

### 4. Права доступа

```bash
chmod 755 api/
chmod 755 uploads/
chmod 644 config/*.php
```

## Демо-аккаунты

После импорта схемы БД доступны следующие аккаунты:

| Роль | Email | Пароль |
|------|-------|--------|
| Супер-администратор | superadmin@damdiqr.com | admin123 |
| Владелец ресторана | admin@demo.com | admin123 |
| Сотрудник | staff@demo.com | staff123 |

**Не можете войти?** См. [FIX-LOGIN.md](FIX-LOGIN.md)

## Роли и возможности

### SUPER_ADMIN (Владелец платформы)
- Просмотр статистики по всей платформе
- Создание и управление аккаунтами ресторанов
- Блокировка/разблокировка заведений
- Управление тарифными планами

### ADMIN (Владелец ресторана)
- Просмотр статистики своего ресторана
- Управление меню (категории и блюда)
- Управление столиками и QR-кодами
- Управление сотрудниками
- Просмотр заказов

### STAFF (Сотрудник)
- Просмотр доски заказов (Kanban)
- Изменение статусов заказов
- Real-time обновления через AJAX Polling

### CLIENT (Гость)
- Просмотр меню через QR-код
- Поиск по блюдам
- Добавление в корзину
- Оформление заказа

## Особенности реализации

### AJAX Polling
Вместо WebSockets используется AJAX Polling для обновления заказов в реальном времени:
- Запросы каждые 5 секунд к `/api/orders/poll.php`
- Передача `last_check` timestamp для получения только новых данных
- Автоматическое обновление Kanban-доски без перезагрузки

### Обработка изображений
- Автоматическая конвертация в WebP
- Сжатие до 300-500 КБ
- Ресайз до максимум 1200x1200px
- Адаптивное качество (85-60%)

### Безопасность
- Prepared Statements для всех SQL запросов
- password_hash() для хеширования паролей
- Проверка ролей на уровне API
- Валидация всех входных данных

## API Endpoints

### Аутентификация
- `POST /api/auth/login.php` - Вход в систему
- `GET /api/auth/logout.php` - Выход
- `GET /api/auth/me.php` - Текущий пользователь

### Рестораны (SUPER_ADMIN)
- `GET /api/restaurants/list.php` - Список заведений
- `POST /api/restaurants/create.php` - Создать заведение
- `POST /api/restaurants/update.php` - Обновить заведение
- `POST /api/restaurants/delete.php` - Удалить заведение
- `GET /api/restaurants/stats.php` - Общая статистика

### Заказы (ADMIN, STAFF)
- `GET /api/orders/list.php?status=NEW&limit=50` - Список заказов
- `POST /api/orders/update-status.php` - Изменить статус
- `GET /api/orders/poll.php?last_check=timestamp` - Polling endpoint

### Меню (Публичный)
- `GET /api/menu/list.php?restaurant_id=1` - Получить меню

### Меню (ADMIN)
- `POST /api/menu/create-item.php` - Создать блюдо
- `POST /api/menu/update-item.php` - Обновить блюдо
- `POST /api/menu/delete-item.php` - Удалить блюдо

### Загрузка (ADMIN, SUPER_ADMIN)
- `POST /api/upload/image.php` - Загрузить изображение

## Использование

### Для владельцев ресторанов

1. Войдите в систему через `/login.html`
2. Перейдите в панель управления
3. Добавьте категории и блюда в меню
4. Создайте столики и сгенерируйте QR-коды
5. Добавьте сотрудников
6. Распечатайте и разместите QR-коды на столиках

### Для гостей

1. Отсканируйте QR-код на столике
2. Откроется меню с блюдами ресторана
3. Выберите блюда и добавьте в корзину
4. Оформите заказ

### Для сотрудников

1. Войдите в систему
2. Откроется Kanban-доска с заказами
3. Заказы автоматически появляются в колонке "Новые"
4. Перемещайте заказы: Новые → Готовятся → Поданы

## Разработка

### Создание нового API endpoint

```php
<?php
header('Content-Type: application/json');
require_once '../../config/database.php';
require_once '../../config/session.php';

requireRole('ADMIN'); // Проверка роли

$database = new Database();
$db = $database->getConnection();

try {
    $stmt = $db->prepare("SELECT * FROM table WHERE id = ?");
    $stmt->execute(array($id));
    $result = $stmt->fetch();
    
    echo json_encode(array('success' => true, 'data' => $result));
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
}
```

## Лицензия

Proprietary - Все права защищены

## Поддержка

Для вопросов и поддержки: support@damdiqr.com

# DAMDI_QR_ORG
