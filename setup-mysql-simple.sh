#!/bin/bash

echo "🔧 Запускаю MySQL через Docker (без docker-compose)..."

# Останавливаем старый контейнер если есть
docker stop damdiqr_mysql 2>/dev/null
docker rm damdiqr_mysql 2>/dev/null

# Запускаем MySQL
echo "🚀 Запускаю MySQL..."
docker run -d \
  --name damdiqr_mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=damdi_qr \
  -e MYSQL_USER=damdi_user \
  -e MYSQL_PASSWORD=damdi_password \
  -p 3306:3306 \
  -v damdiqr_mysql_data:/var/lib/mysql \
  mysql:8.0 \
  --default-authentication-plugin=mysql_native_password

if [ $? -ne 0 ]; then
    echo "❌ Не удалось запустить MySQL!"
    exit 1
fi

echo "⏳ Жду запуска MySQL (15 секунд)..."
sleep 15

# Проверяем подключение
echo "🔍 Проверяю подключение..."
docker exec damdiqr_mysql mysql -udamdi_user -pdamdi_password damdi_qr -e "SELECT 1" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ MySQL запущен!"
    echo ""
    echo "📝 Импортирую схему БД..."
    docker exec -i damdiqr_mysql mysql -udamdi_user -pdamdi_password damdi_qr < database/schema.sql 2>&1 | grep -v "Using a password" || echo "Схема импортирована"
    
    echo "✅ MySQL готов!"
    echo ""
    echo "📝 Обновляю nodejs/.env..."
    
    cat > nodejs/.env << 'ENVEOF'
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
    
    echo "✅ ВСЁ ГОТОВО!"
    echo ""
    echo "🔄 Перезапустите backend:"
    echo "   cd nodejs && npm run dev"
else
    echo "⚠️ MySQL запущен, но подключение не работает"
    echo "Проверьте: docker logs damdiqr_mysql"
fi
