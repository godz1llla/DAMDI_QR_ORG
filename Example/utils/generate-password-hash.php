<?php

if (php_sapi_name() !== 'cli') {
    die('Этот скрипт должен запускаться из командной строки');
}

$passwords = array(
    'admin123',
    'staff123'
);

echo "Генерация хешей паролей:\n\n";

foreach ($passwords as $password) {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    echo "Пароль: $password\n";
    echo "Хеш: $hash\n\n";
}

echo "Скопируйте эти хеши в database/schema.sql\n";

