# Dámdi QR - Node.js + React + TypeScript

Современная SaaS платформа для управления ресторанами с QR-меню.

## 🚀 Технологии

- **Backend:** Node.js + Express + TypeScript
- **Frontend:** React + TypeScript + Vite
- **База данных:** MySQL
- **Аутентификация:** JWT

## 📦 Структура проекта

```
DAMDIQRRR/
├── nodejs/              # Backend API
│   ├── src/
│   │   ├── controllers/ # Контроллеры API
│   │   ├── routes/      # Роуты
│   │   ├── middleware/  # Middleware (auth)
│   │   ├── utils/       # Утилиты (QR, тарифы)
│   │   └── server.ts    # Точка входа
│   └── package.json
│
├── react-app/           # Frontend приложение
│   ├── src/
│   │   ├── api/         # API клиенты
│   │   ├── pages/       # Страницы
│   │   ├── components/  # Компоненты
│   │   └── contexts/    # Context (Auth)
│   └── package.json
│
├── database/            # SQL схемы
│   └── schema.sql
│
└── uploads/             # Загруженные файлы
```

## 🚀 Быстрый старт

### 1. База данных

Импортируйте схему:
```bash
mysql -u your_user -p damdi_qr < database/schema.sql
```

### 2. Backend

```bash
cd nodejs
npm install
cp .env.example .env
# Отредактируйте .env с настройками БД
npm run dev
```

Backend запустится на `http://localhost:3000`

### 3. Frontend

```bash
cd react-app
npm install
npm run dev
```

Frontend запустится на `http://localhost:5173`

## 🔐 Демо аккаунты

### Супер-администратор
- Email: `superadmin@damdiqr.com`
- Пароль: `admin123`

### Администратор ресторана
- Email: `admin@demo.com`
- Пароль: `admin123`

### Сотрудник
- Email: `staff@demo.com`
- Пароль: `staff123`

## 📝 API Endpoints

### Auth
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Текущий пользователь
- `POST /api/auth/logout` - Выход

### Restaurants
- `POST /api/restaurants` - Создать ресторан (SUPER_ADMIN)
- `GET /api/restaurants` - Список ресторанов (SUPER_ADMIN)
- `GET /api/restaurants/my` - Мой ресторан (ADMIN)
- `PUT /api/restaurants/my` - Обновить ресторан (ADMIN)

### Menu
- `GET /api/menu?restaurant_id=1` - Получить меню
- `POST /api/menu/categories` - Создать категорию (ADMIN)
- `POST /api/menu/items` - Создать блюдо (ADMIN)
- `PUT /api/menu/items/:id` - Обновить блюдо (ADMIN)
- `DELETE /api/menu/categories/:id` - Удалить категорию (ADMIN)
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

### Staff
- `GET /api/staff` - Список сотрудников (ADMIN)
- `POST /api/staff` - Добавить сотрудника (ADMIN)
- `DELETE /api/staff/:id` - Удалить сотрудника (ADMIN)

### QR Codes
- `GET /api/qr/generate?table_id=1` - Скачать QR (ADMIN)
- `GET /api/qr/preview?table_id=1` - Превью QR (ADMIN)

## 🎯 Роли пользователей

1. **SUPER_ADMIN** - Управление заведениями
2. **ADMIN** - Управление рестораном (меню, столики, сотрудники)
3. **STAFF** - Доска заказов

## 💎 Тарифы

- **FREE:** До 5 столиков, до 5 категорий
- **PREMIUM:** До 999 столиков, до 999 категорий

## 🔧 Разработка

```bash
# Backend (hot reload)
cd nodejs
npm run dev

# Frontend (hot reload)
cd react-app
npm run dev

# Production build
cd nodejs
npm run build
npm start

cd react-app
npm run build
```

## 📄 Лицензия

ISC

# DAMDI_QR
