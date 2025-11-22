#!/bin/bash

echo "🔧 Настройка локальной БД..."

# Проверяем Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен!"
    exit 1
fi

echo "✅ Docker найден"

# Определяем команду docker compose
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
    echo "✅ Используется: docker compose"
elif docker-compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
    echo "✅ Используется: docker-compose"
else
    echo "❌ Docker Compose не найден!"
    echo ""
    echo "Установите docker-compose:"
    echo "  sudo apt install docker-compose -y"
    echo "  или"
    echo "  sudo apt install docker-compose-plugin -y"
    exit 1
fi

# Останавливаем старые контейнеры
echo "🛑 Останавливаю старые контейнеры..."
$DOCKER_COMPOSE down 2>/dev/null || true

# Запускаем MySQL
echo "🚀 Запускаю MySQL в Docker..."
$DOCKER_COMPOSE up -d

if [ $? -ne 0 ]; then
    echo "❌ Не удалось запустить MySQL!"
    echo "Проверьте логи: $DOCKER_COMPOSE logs"
    exit 1
fi

echo "⏳ Жду запуска MySQL (15 секунд)..."
sleep 15

# Проверяем подключение
echo "🔍 Проверяю подключение..."
$DOCKER_COMPOSE exec -T mysql mysql -udamdi_user -pdamdi_password damdi_qr -e "SELECT 1" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ MySQL запущен и работает!"
    echo ""
    echo "📝 Обновляю nodejs/.env..."
    
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
    echo "🔄 Теперь перезапустите backend:"
    echo "   cd nodejs && npm run dev"
else
    echo "⚠️ MySQL запущен, но подключение не работает"
    echo ""
    echo "Проверьте логи:"
    echo "   $DOCKER_COMPOSE logs mysql"
    echo ""
    echo "Или попробуйте подключиться вручную:"
    echo "   docker exec -it damdiqr_mysql mysql -udamdi_user -pdamdi_password damdi_qr"
fi
