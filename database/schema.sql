-- Создание базы данных
CREATE DATABASE IF NOT EXISTS damdi_qr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE damdi_qr;

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('SUPER_ADMIN', 'ADMIN', 'STAFF') NOT NULL,
    restaurant_id INT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица заведений
CREATE TABLE IF NOT EXISTS restaurants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id INT NOT NULL,
    plan ENUM('FREE', 'PREMIUM') DEFAULT 'FREE',
    address VARCHAR(500),
    phone VARCHAR(50),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_owner (owner_id),
    INDEX idx_plan (plan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица категорий меню
CREATE TABLE IF NOT EXISTS menu_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    INDEX idx_restaurant (restaurant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица блюд
CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE,
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица столиков
CREATE TABLE IF NOT EXISTS tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    table_number VARCHAR(50) NOT NULL,
    qr_code_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    INDEX idx_restaurant (restaurant_id),
    UNIQUE KEY unique_table (restaurant_id, table_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    table_id INT NOT NULL,
    status ENUM('NEW', 'PREPARING', 'SERVED', 'COMPLETED', 'CANCELLED') DEFAULT 'NEW',
    total_amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE,
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица элементов заказа
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    INDEX idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица для обновления внешних ключей
ALTER TABLE users ADD CONSTRAINT fk_users_restaurant 
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;

-- Вставка демо-данных

-- Супер-администратор (email: superadmin@damdiqr.com, пароль: admin123)
INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES
('superadmin@damdiqr.com', '$2y$10$256PX49ttD5VI/b5YDN4MeM5qOtieUWwEPbptpAMK22Afg9kPUVw.', 'SUPER_ADMIN', 'Супер', 'Администратор');

-- Демо-ресторан
INSERT INTO restaurants (name, owner_id, plan, address, phone) VALUES
('Демо Ресторан', 1, 'PREMIUM', 'ул. Пушкина, д. 10', '+7 (999) 123-45-67');

-- Владелец ресторана (email: admin@demo.com, пароль: admin123)
INSERT INTO users (email, password_hash, role, restaurant_id, first_name, last_name) VALUES
('admin@demo.com', '$2y$10$256PX49ttD5VI/b5YDN4MeM5qOtieUWwEPbptpAMK22Afg9kPUVw.', 'ADMIN', 1, 'Иван', 'Петров');

-- Сотрудник (email: staff@demo.com, пароль: staff123)
INSERT INTO users (email, password_hash, role, restaurant_id, first_name, last_name) VALUES
('staff@demo.com', '$2y$10$TsLyiQcEQxf.huJA4dxAruC97hswGl6XxoEQ7juSDq3SKeOVJouui', 'STAFF', 1, 'Мария', 'Сидорова');

-- Обновление owner_id
UPDATE restaurants SET owner_id = 2 WHERE id = 1;

-- Категории меню
INSERT INTO menu_categories (restaurant_id, name, sort_order) VALUES
(1, 'Закуски', 1),
(1, 'Горячие блюда', 2),
(1, 'Супы', 3),
(1, 'Салаты', 4),
(1, 'Десерты', 5),
(1, 'Напитки', 6);

-- Блюда
INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available, sort_order) VALUES
(1, 1, 'Брускетта с томатами', 'Хрустящий хлеб с сочными томатами и базиликом', 350.00, TRUE, 1),
(1, 1, 'Сырная тарелка', 'Ассорти европейских сыров с виноградом', 890.00, TRUE, 2),
(1, 2, 'Стейк Рибай', 'Сочный стейк из мраморной говядины', 1890.00, TRUE, 1),
(1, 2, 'Паста Карбонара', 'Классическая итальянская паста с беконом', 650.00, TRUE, 2),
(1, 3, 'Том Ям', 'Острый тайский суп с креветками', 590.00, TRUE, 1),
(1, 3, 'Борщ украинский', 'Традиционный борщ со сметаной', 390.00, TRUE, 2),
(1, 4, 'Цезарь с курицей', 'Классический салат с курицей и соусом', 490.00, TRUE, 1),
(1, 4, 'Греческий салат', 'Свежие овощи с сыром фета', 420.00, TRUE, 2),
(1, 5, 'Тирамису', 'Итальянский десерт с кофе и маскарпоне', 380.00, TRUE, 1),
(1, 5, 'Чизкейк Нью-Йорк', 'Классический американский чизкейк', 420.00, TRUE, 2),
(1, 6, 'Эспрессо', 'Крепкий итальянский кофе', 150.00, TRUE, 1),
(1, 6, 'Свежевыжатый сок', 'Апельсиновый или яблочный', 280.00, TRUE, 2);

-- Столики
INSERT INTO tables (restaurant_id, table_number, is_active) VALUES
(1, '1', TRUE),
(1, '2', TRUE),
(1, '3', TRUE),
(1, '4', TRUE),
(1, '5', TRUE),
(1, '6', TRUE),
(1, '7', TRUE),
(1, '8', TRUE),
(1, '9', TRUE),
(1, '10', TRUE);

-- Тестовые заказы
INSERT INTO orders (restaurant_id, table_id, status, total_amount) VALUES
(1, 1, 'NEW', 840.00),
(1, 2, 'PREPARING', 1540.00),
(1, 3, 'SERVED', 780.00);

-- Элементы заказов
INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES
(1, 1, 2, 350.00),
(1, 7, 1, 490.00),
(2, 3, 1, 1890.00),
(2, 9, 1, 380.00),
(3, 4, 1, 650.00),
(3, 11, 2, 150.00);

