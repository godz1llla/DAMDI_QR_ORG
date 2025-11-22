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

if (!isset($input['id'])) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'ID заведения обязателен'));
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
    
    if (isset($input['is_active'])) {
        $updates[] = "is_active = ?";
        $params[] = $input['is_active'] ? 1 : 0;
    }
    
    if (isset($input['plan'])) {
        $updates[] = "plan = ?";
        $params[] = $input['plan'];
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'message' => 'Нет данных для обновления'));
        exit();
    }
    
    $params[] = $input['id'];
    
    $stmt = $db->prepare("UPDATE restaurants SET " . implode(", ", $updates) . " WHERE id = ?");
    $stmt->execute($params);
    
    echo json_encode(array(
        'success' => true,
        'message' => 'Заведение успешно обновлено'
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Update Restaurant Error: " . $e->getMessage());
}

