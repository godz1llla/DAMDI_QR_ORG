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

if (!isset($input['id'])) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'ID блюда обязателен'));
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
    $updates = array();
    $params = array();
    
    if (isset($input['name'])) {
        $updates[] = "name = ?";
        $params[] = $input['name'];
    }
    
    if (isset($input['description'])) {
        $updates[] = "description = ?";
        $params[] = $input['description'];
    }
    
    if (isset($input['price'])) {
        $updates[] = "price = ?";
        $params[] = $input['price'];
    }
    
    if (isset($input['image_url'])) {
        $updates[] = "image_url = ?";
        $params[] = $input['image_url'];
    }
    
    if (isset($input['is_available'])) {
        $updates[] = "is_available = ?";
        $params[] = $input['is_available'] ? 1 : 0;
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'message' => 'Нет данных для обновления'));
        exit();
    }
    
    $params[] = $input['id'];
    $params[] = $restaurantId;
    
    $stmt = $db->prepare("
        UPDATE menu_items 
        SET " . implode(", ", $updates) . " 
        WHERE id = ? AND restaurant_id = ?
    ");
    $stmt->execute($params);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(array('success' => false, 'message' => 'Блюдо не найдено'));
        exit();
    }
    
    echo json_encode(array(
        'success' => true,
        'message' => 'Блюдо успешно обновлено'
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Update Menu Item Error: " . $e->getMessage());
}

