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
    $stmt = $db->prepare("SELECT * FROM restaurants WHERE id = ? LIMIT 1");
    $stmt->execute(array($restaurantId));
    $restaurant = $stmt->fetch();
    
    if (!$restaurant) {
        http_response_code(404);
        echo json_encode(array('success' => false, 'message' => 'Ресторан не найден'));
        exit();
    }
    
    echo json_encode(array(
        'success' => true,
        'restaurant' => $restaurant
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Get Restaurant Error: " . $e->getMessage());
}

