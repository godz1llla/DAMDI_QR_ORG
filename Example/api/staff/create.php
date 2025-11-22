<?php
header('Content-Type: application/json');
require_once '../../config/database.php';
require_once '../../config/session.php';

requireRole('ADMIN');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('success' => false, 'message' => 'Метод не разрешён'));
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email']) || !isset($input['password']) || 
    !isset($input['first_name']) || !isset($input['last_name'])) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'Все поля обязательны'));
    exit();
}

$user = getUser();
$restaurantId = $user['restaurant_id'];

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка подключения к базе данных'));
    exit();
}

try {
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmt->execute(array($input['email']));
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'message' => 'Email уже используется'));
        exit();
    }
    
    $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);
    
    $stmt = $db->prepare("
        INSERT INTO users (email, password_hash, role, restaurant_id, first_name, last_name) 
        VALUES (?, ?, 'STAFF', ?, ?, ?)
    ");
    $stmt->execute(array(
        $input['email'],
        $passwordHash,
        $restaurantId,
        $input['first_name'],
        $input['last_name']
    ));
    
    $staffId = $db->lastInsertId();
    
    echo json_encode(array(
        'success' => true,
        'message' => 'Сотрудник успешно добавлен',
        'staff_id' => $staffId
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Create Staff Error: " . $e->getMessage());
}

