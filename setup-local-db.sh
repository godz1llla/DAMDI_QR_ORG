#!/bin/bash

echo "🔧 Настройка локальной БД..."

# Проверяем Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен!"
    echo ""
    echo "Установите Docker:"
    echo "  sudo apt update"
    echo "  sudo apt install docker.io docker-compose -y"
    echo "  sudo systemctl start docker"
    echo "  sudo systemctl enable docker"
    echo "  sudo usermod -aG docker \$USER"
    echo ""
    echo "После установки перезайдите в систему и запустите этот скрипт снова!"
    exit 1
fi

echo "✅ Docker найден"

# Определяем команду docker compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif docker-compose version &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Docker Compose не найден!"
    echo "Установите: sudo apt install docker-compose -y"
    exit 1
fi

# Останавливаем старые контейнеры
$DOCKER_COMPOSE down 2>/dev/null

# Запускаем MySQL
echo "🚀 Запускаю MySQL..."
$DOCKER_COMPOSE up -d

echo "⏳ Жду запуска MySQL (10 секунд)..."
sleep 10

# Проверяем подключение
echo "🔍 Проверяю подключение..."
$DOCKER_COMPOSE exec -T mysql mysql -udamdi_user -pdamdi_password damdi_qr -e "SELECT 1" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ MySQL запущен и работает!"
    echo ""
    echo "📝 Настройки для nodejs/.env:"
    echo "   DB_HOST=localhost"
    echo "   DB_USER=damdi_user"
    echo "   DB_PASSWORD=damdi_password"
    echo "   DB_NAME=damdi_qr"
    echo ""
    echo "🔄 Обновляю nodejs/.env..."
    
    # Обновляем .env
    cd nodejs
    cat > .env << 'ENVEOF'
# Server
PORT=3000
NODE_ENV=development

# Database (локальная через Docker)
DB_HOST=localhost
DB_USER=damdi_user
DB_PASSWORD=damdi_password
DB_NAME=damdi_qr

# JWT
JWT_SECRET=damdiqr_super_secret_key_change_in_production_2024
JWT_EXPIRES_IN=7d

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ENVEOF
    
    echo "✅ Готово!"
    echo ""
    echo "🔄 Перезапустите backend:"
    echo "   cd nodejs && npm run dev"
else
    echo "⚠️ MySQL запущен, но подключение не работает"
    echo "   Попробуйте: $DOCKER_COMPOSE logs mysql"
fi
