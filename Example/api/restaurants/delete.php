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
    $stmt = $db->prepare("DELETE FROM restaurants WHERE id = ?");
    $stmt->execute(array($input['id']));
    
    echo json_encode(array(
        'success' => true,
        'message' => 'Заведение успешно удалено'
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Delete Restaurant Error: " . $e->getMessage());
}

