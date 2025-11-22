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
    echo json_encode(array('success' => false, 'message' => 'ID столика обязателен'));
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
    // Проверяем есть ли активные заказы для этого столика
    $stmt = $db->prepare("
        SELECT COUNT(*) as count 
        FROM orders 
        WHERE table_id = ? AND status IN ('NEW', 'PREPARING', 'SERVED')
    ");
    $stmt->execute(array($input['id']));
    $result = $stmt->fetch();
    
    if ($result['count'] > 0) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'message' => 'Нельзя удалить столик с активными заказами'));
        exit();
    }
    
    $stmt = $db->prepare("DELETE FROM tables WHERE id = ? AND restaurant_id = ?");
    $stmt->execute(array($input['id'], $restaurantId));
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(array('success' => false, 'message' => 'Столик не найден'));
        exit();
    }
    
    echo json_encode(array(
        'success' => true,
        'message' => 'Столик успешно удалён'
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Delete Table Error: " . $e->getMessage());
}

