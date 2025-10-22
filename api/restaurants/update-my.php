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
    $updates = array();
    $params = array();
    
    if (isset($input['name'])) {
        $updates[] = "name = ?";
        $params[] = $input['name'];
    }
    
    if (isset($input['address'])) {
        $updates[] = "address = ?";
        $params[] = $input['address'];
    }
    
    if (isset($input['phone'])) {
        $updates[] = "phone = ?";
        $params[] = $input['phone'];
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'message' => 'Нет данных для обновления'));
        exit();
    }
    
    $params[] = $restaurantId;
    
    $stmt = $db->prepare("UPDATE restaurants SET " . implode(", ", $updates) . " WHERE id = ?");
    $stmt->execute($params);
    
    echo json_encode(array(
        'success' => true,
        'message' => 'Профиль успешно обновлён'
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Update Restaurant Error: " . $e->getMessage());
}

