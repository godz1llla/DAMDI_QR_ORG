# Структура проекта Dámdi QR

## 📁 Корневая директория

```
DAMDIQRRR/
├── api/                      # REST API endpoints
│   ├── auth/                # Аутентификация
│   │   ├── login.php       # Вход в систему
│   │   ├── logout.php      # Выход
│   │   └── me.php          # Текущий пользователь
│   ├── menu/               # Управление меню
│   │   ├── create-category.php
│   │   ├── create-item.php
│   │   ├── delete-category.php
│   │   ├── delete-item.php
│   │   ├── list.php
│   │   └── update-item.php
│   ├── orders/             # Управление заказами
│   │   ├── create.php
│   │   ├── list.php
│   │   ├── poll.php        # AJAX Polling endpoint
│   │   ├── stats.php       # Статистика
│   │   └── update-status.php
│   ├── restaurants/        # Управление заведениями
│   │   ├── create.php      # (SUPER_ADMIN)
│   │   ├── delete.php      # (SUPER_ADMIN)
│   │   ├── get-my.php      # (ADMIN)
│   │   ├── list.php        # (SUPER_ADMIN)
│   │   ├── stats.php       # (SUPER_ADMIN)
│   │   ├── update-my.php   # (ADMIN)
│   │   └── update.php      # (SUPER_ADMIN)
│   ├── staff/              # Управление сотрудниками
│   │   ├── create.php
│   │   ├── delete.php
│   │   └── list.php
│   ├── tables/             # Управление столиками
│   │   ├── create.php
│   │   ├── delete.php
│   │   └── list.php
│   └── upload/             # Загрузка файлов
│       └── image.php       # Загрузка и обработка изображений
│
├── config/                 # Конфигурация
│   ├── database.php       # Подключение к БД
│   └── session.php        # Управление сеансами
│
├── dashboard/             # Административные панели
│   ├── admin.html        # Панель владельца ресторана
│   ├── staff.html        # Доска заказов сотрудника
│   └── super-admin.html  # Панель супер-администратора
│
├── database/              # База данных
│   ├── fix-passwords.sql # Исправление паролей (если нужно)
│   └── schema.sql        # Полная схема БД + демо-данные
│
├── menu/                  # Клиентское меню
│   └── client.html       # Мобильное меню для гостей
│
├── uploads/               # Загруженные файлы
│   └── .gitkeep          # Сохранение директории в git
│
├── utils/                 # Утилиты
│   ├── generate-password-hash.php  # Генератор хешей
│   └── image-processor.php         # Обработка изображений
│
├── .gitignore            # Исключения для Git
├── .htaccess             # Конфигурация Apache
├── FIX-LOGIN.md          # Руководство по исправлению входа
├── index.html            # Главная страница (лендинг)
├── INSTALL.md            # Инструкция по установке
├── login.html            # Страница входа
├── PROJECT-STRUCTURE.md  # Этот файл
└── README.md             # Основная документация
```

## 🎯 Назначение основных компонентов

### API Endpoints

**Публичные (без авторизации):**
- `POST /api/auth/login.php` - Вход в систему
- `GET /api/menu/list.php?restaurant_id=X` - Получение меню
- `POST /api/orders/create.php` - Создание заказа клиентом

**SUPER_ADMIN:**
- Полный доступ к `/api/restaurants/*`
- Просмотр статистики по всей платформе

**ADMIN:**
- Управление своим рестораном: `/api/restaurants/get-my.php`, `/api/restaurants/update-my.php`
- Полный доступ к `/api/menu/*`, `/api/tables/*`, `/api/staff/*`
- Просмотр и статистика заказов: `/api/orders/*`

**STAFF:**
- Просмотр заказов: `/api/orders/list.php`, `/api/orders/poll.php`
- Обновление статусов: `/api/orders/update-status.php`

### Интерфейсы

**Публичные:**
- `/index.html` - Лендинг платформы
- `/login.html` - Страница входа
- `/menu/client.html?restaurant_id=X&table_id=Y` - Меню для гостей

**Административные:**
- `/dashboard/super-admin.html` - Управление всей платформой
- `/dashboard/admin.html` - Управление рестораном (5 вкладок)
  - Главная - статистика и последние заказы
  - Меню - управление категориями и блюдами
  - Столики - управление столиками и QR-кодами
  - Сотрудники - управление персоналом
  - Настройки - профиль ресторана и аналитика
- `/dashboard/staff.html` - Kanban-доска заказов

## 🔒 Безопасность

1. **Prepared Statements** - все SQL запросы используют prepared statements
2. **Password Hashing** - пароли хешируются через `password_hash()`
3. **Session Management** - проверка ролей на каждом API endpoint
4. **File Upload** - валидация типов файлов, конвертация в WebP
5. **.htaccess** - защита конфигурационных файлов

## 🔄 Особенности реализации

### AJAX Polling
Вместо WebSockets используется AJAX Polling:
- Запросы каждые 5 секунд к `/api/orders/poll.php`
- Передача timestamp последней проверки
- Получение только новых данных

### Обработка изображений
При загрузке фото блюд:
1. Проверка типа файла
2. Resize до 1200x1200px максимум
3. Конвертация в WebP
4. Сжатие до 300-500 КБ
5. Адаптивное качество (85-60%)

### Демо-аккаунты
Все пароли: `admin123` или `staff123`
- `superadmin@damdiqr.com` - SUPER_ADMIN
- `admin@demo.com` - ADMIN (Демо Ресторан)
- `staff@demo.com` - STAFF (Демо Ресторан)

## 📊 База данных

### Таблицы
- `users` - Пользователи (все роли)
- `restaurants` - Заведения
- `menu_categories` - Категории меню
- `menu_items` - Блюда
- `tables` - Столики
- `orders` - Заказы
- `order_items` - Элементы заказов

### Связи
- `users.restaurant_id` → `restaurants.id`
- `restaurants.owner_id` → `users.id`
- `menu_items.category_id` → `menu_categories.id`
- `orders.table_id` → `tables.id`
- `order_items.order_id` → `orders.id`

## 🚀 Быстрый старт

```bash
# 1. Импорт БД
mysql -u root -p < database/schema.sql

# 2. Настройка конфигурации
nano config/database.php

# 3. Права доступа
chmod 755 uploads/

# 4. Доступ
http://localhost/login.html
```

## 📝 Технический стек

- **Backend:** PHP 7.4+ (Vanilla, без фреймворков)
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Database:** MySQL 5.7+
- **Image Processing:** GD Library
- **Web Server:** Apache/Nginx

## 🔧 Настройка для production

1. **Измените пароли БД** в `config/database.php`
2. **Настройте HTTPS** (Let's Encrypt)
3. **Отключите отображение ошибок** в `php.ini`
4. **Настройте backup** базы данных
5. **Проверьте права доступа** к файлам
6. **Удалите демо-данные** из БД (опционально)

## 📞 Поддержка

- Документация: `README.md`
- Установка: `INSTALL.md`
- Проблемы со входом: `FIX-LOGIN.md`

