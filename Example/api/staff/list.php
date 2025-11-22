<?php
header('Content-Type: application/json');
require_once '../../config/database.php';
require_once '../../config/session.php';

requireRole('ADMIN');

$user = getUser();
$restaurantId = $user['restaurant_id'];

if (!$restaurantId) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'Ресторан не найден'));
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
    $stmt = $db->prepare("
        SELECT id, email, first_name, last_name, role, is_blocked, created_at 
        FROM users 
        WHERE restaurant_id = ? AND role = 'STAFF'
        ORDER BY created_at DESC
    ");
    $stmt->execute(array($restaurantId));
    $staff = $stmt->fetchAll();
    
    echo json_encode(array(
        'success' => true,
        'staff' => $staff
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Get Staff Error: " . $e->getMessage());
}

