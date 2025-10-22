<?php
header('Content-Type: application/json');
require_once '../../config/database.php';
require_once '../../config/session.php';

requireRole(array('ADMIN', 'STAFF'));

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('success' => false, 'message' => 'Метод не разрешён'));
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['id']) || !isset($input['status'])) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'ID заказа и статус обязательны'));
    exit();
}

$allowedStatuses = array('NEW', 'PREPARING', 'SERVED', 'COMPLETED', 'CANCELLED');
if (!in_array($input['status'], $allowedStatuses)) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'Некорректный статус'));
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
        UPDATE orders 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND restaurant_id = ?
    ");
    $stmt->execute(array($input['status'], $input['id'], $restaurantId));
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(array('success' => false, 'message' => 'Заказ не найден'));
        exit();
    }
    
    echo json_encode(array(
        'success' => true,
        'message' => 'Статус заказа обновлён'
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Update Order Status Error: " . $e->getMessage());
}

