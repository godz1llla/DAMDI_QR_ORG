# Dámdi QR Backend (Node.js + TypeScript)

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка базы данных

Скопируйте `.env.example` в `.env` и настройте:

```bash
cp .env.example .env
```

Отредактируйте `.env`:
```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=damdi_qr
JWT_SECRET=your_super_secret_jwt_key
PORT=3000
```

### 3. Импорт схемы БД

Выполните SQL скрипт из `database/schema.sql`:
```bash
mysql -u your_user -p damdi_qr < ../database/schema.sql
```

### 4. Запуск

**Режим разработки:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## 📁 Структура проекта

```
nodejs/
├── src/
│   ├── config/          # Конфигурация БД
│   ├── controllers/     # Контроллеры API
│   ├── middleware/      # Middleware (auth, etc)
│   ├── routes/          # Роуты API
│   ├── types/           # TypeScript типы
│   ├── utils/           # Утилиты (QR, тарифы)
│   └── server.ts        # Точка входа
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Endpoints

### Auth
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Текущий пользователь
- `POST /api/auth/logout` - Выход

### Restaurants
- `POST /api/restaurants` - Создать ресторан (SUPER_ADMIN)
- `GET /api/restaurants` - Список ресторанов (SUPER_ADMIN)
- `GET /api/restaurants/my` - Мой ресторан (ADMIN)
- `PUT /api/restaurants/my` - Обновить ресторан (ADMIN)
- `GET /api/restaurants/limits` - Лимиты тарифа

### Menu
- `GET /api/menu?restaurant_id=1` - Получить меню
- `POST /api/menu/categories` - Создать категорию (ADMIN)
- `DELETE /api/menu/categories/:id` - Удалить категорию (ADMIN)
- `POST /api/menu/items` - Создать блюдо (ADMIN)
- `PUT /api/menu/items/:id` - Обновить блюдо (ADMIN)
- `DELETE /api/menu/items/:id` - Удалить блюдо (ADMIN)

### Tables
- `GET /api/tables` - Список столиков (ADMIN)
- `POST /api/tables` - Создать столик (ADMIN)
- `DELETE /api/tables/:id` - Удалить столик (ADMIN)

### Orders
- `POST /api/orders` - Создать заказ
- `GET /api/orders` - Список заказов (ADMIN/STAFF)
- `GET /api/orders/poll?last_id=0` - Получить новые заказы (STAFF)
- `PUT /api/orders/:id/status` - Обновить статус (STAFF)
- `GET /api/orders/stats` - Статистика (ADMIN)

### Staff
- `GET /api/staff` - Список сотрудников (ADMIN)
- `POST /api/staff` - Добавить сотрудника (ADMIN)
- `DELETE /api/staff/:id` - Удалить сотрудника (ADMIN)

### QR Codes
- `GET /api/qr/generate?table_id=1` - Скачать QR (ADMIN)
- `GET /api/qr/preview?table_id=1` - Превью QR (ADMIN)

## 🔐 Аутентификация

Все защищенные роуты требуют JWT токен в заголовке:
```
Authorization: Bearer <token>
```

## 📦 Технологии

- **Express** - веб-фреймворк
- **TypeScript** - типизация
- **MySQL2** - база данных
- **bcryptjs** - хеширование паролей
- **jsonwebtoken** - JWT токены
- **qrcode** - генерация QR-кодов
- **sharp** - обработка изображений

## 🎯 Следующие шаги

1. Добавить валидацию (Joi/Zod)
2. Добавить логирование (Winston)
3. Добавить тесты (Jest)
4. Настроить CI/CD

