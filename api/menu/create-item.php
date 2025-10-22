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

if (!isset($input['category_id']) || !isset($input['name']) || !isset($input['price'])) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'Обязательные поля: category_id, name, price'));
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
    $stmt = $db->prepare("
        INSERT INTO menu_items 
        (restaurant_id, category_id, name, description, price, image_url, is_available, sort_order) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute(array(
        $restaurantId,
        $input['category_id'],
        $input['name'],
        $input['description'] ?? '',
        $input['price'],
        $input['image_url'] ?? null,
        isset($input['is_available']) ? $input['is_available'] : true,
        $input['sort_order'] ?? 0
    ));
    
    $itemId = $db->lastInsertId();
    
    echo json_encode(array(
        'success' => true,
        'message' => 'Блюдо успешно добавлено',
        'item_id' => $itemId
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Create Menu Item Error: " . $e->getMessage());
}

