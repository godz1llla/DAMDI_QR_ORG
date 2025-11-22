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
    echo json_encode(array('success' => false, 'message' => 'ID сотрудника обязателен'));
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
    // Проверяем что это сотрудник нашего ресторана
    $stmt = $db->prepare("
        SELECT role, restaurant_id 
        FROM users 
        WHERE id = ? 
        LIMIT 1
    ");
    $stmt->execute(array($input['id']));
    $staffUser = $stmt->fetch();
    
    if (!$staffUser) {
        http_response_code(404);
        echo json_encode(array('success' => false, 'message' => 'Сотрудник не найден'));
        exit();
    }
    
    if ($staffUser['restaurant_id'] != $restaurantId) {
        http_response_code(403);
        echo json_encode(array('success' => false, 'message' => 'Нет доступа'));
        exit();
    }
    
    if ($staffUser['role'] !== 'STAFF') {
        http_response_code(400);
        echo json_encode(array('success' => false, 'message' => 'Можно удалять только сотрудников'));
        exit();
    }
    
    $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute(array($input['id']));
    
    echo json_encode(array(
        'success' => true,
        'message' => 'Сотрудник успешно удалён'
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Delete Staff Error: " . $e->getMessage());
}

