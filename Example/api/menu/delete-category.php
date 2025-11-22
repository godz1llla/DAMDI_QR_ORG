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
    echo json_encode(array('success' => false, 'message' => 'ID категории обязателен'));
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
    // Проверяем принадлежность категории нашему ресторану
    $stmt = $db->prepare("
        SELECT restaurant_id 
        FROM menu_categories 
        WHERE id = ? 
        LIMIT 1
    ");
    $stmt->execute(array($input['id']));
    $category = $stmt->fetch();
    
    if (!$category) {
        http_response_code(404);
        echo json_encode(array('success' => false, 'message' => 'Категория не найдена'));
        exit();
    }
    
    if ($category['restaurant_id'] != $restaurantId) {
        http_response_code(403);
        echo json_encode(array('success' => false, 'message' => 'Нет доступа'));
        exit();
    }
    
    // Проверяем есть ли блюда в категории
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?");
    $stmt->execute(array($input['id']));
    $result = $stmt->fetch();
    
    if ($result['count'] > 0) {
        http_response_code(400);
        echo json_encode(array(
            'success' => false, 
            'message' => 'Нельзя удалить категорию с блюдами. Сначала удалите все блюда из категории.'
        ));
        exit();
    }
    
    $stmt = $db->prepare("DELETE FROM menu_categories WHERE id = ?");
    $stmt->execute(array($input['id']));
    
    echo json_encode(array(
        'success' => true,
        'message' => 'Категория успешно удалена'
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Delete Category Error: " . $e->getMessage());
}

