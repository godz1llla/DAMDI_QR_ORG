<?php
header('Content-Type: application/json');
require_once '../../config/database.php';
require_once '../../config/session.php';

requireRole('SUPER_ADMIN');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('success' => false, 'message' => 'Метод не разрешён'));
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['restaurant_name']) || !isset($input['owner_email']) || 
    !isset($input['owner_password']) || !isset($input['owner_first_name']) || 
    !isset($input['owner_last_name'])) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'Все поля обязательны'));
    exit();
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка подключения к базе данных'));
    exit();
}

try {
    $db->beginTransaction();
    
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmt->execute(array($input['owner_email']));
    if ($stmt->fetch()) {
        $db->rollBack();
        http_response_code(400);
        echo json_encode(array('success' => false, 'message' => 'Email уже используется'));
        exit();
    }
    
    $passwordHash = password_hash($input['owner_password'], PASSWORD_DEFAULT);
    
    // Сначала создаём ресторан без owner_id
    $stmt = $db->prepare("
        INSERT INTO restaurants (name, owner_id, plan, address, phone) 
        VALUES (?, NULL, ?, ?, ?)
    ");
    $stmt->execute(array(
        $input['restaurant_name'],
        $input['plan'] ?? 'FREE',
        $input['address'] ?? '',
        $input['phone'] ?? ''
    ));
    $restaurantId = $db->lastInsertId();
    
    // Теперь создаём пользователя с restaurant_id
    $stmt = $db->prepare("
        INSERT INTO users (email, password_hash, role, restaurant_id, first_name, last_name) 
        VALUES (?, ?, 'ADMIN', ?, ?, ?)
    ");
    $stmt->execute(array(
        $input['owner_email'],
        $passwordHash,
        $restaurantId,
        $input['owner_first_name'],
        $input['owner_last_name']
    ));
    $ownerId = $db->lastInsertId();
    
    // Обновляем ресторан с правильным owner_id
    $stmt = $db->prepare("UPDATE restaurants SET owner_id = ? WHERE id = ?");
    $stmt->execute(array($ownerId, $restaurantId));
    
    $db->commit();
    
    echo json_encode(array(
        'success' => true,
        'message' => 'Заведение успешно создано',
        'restaurant_id' => $restaurantId
    ));
    
} catch(PDOException $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Create Restaurant Error: " . $e->getMessage());
}

