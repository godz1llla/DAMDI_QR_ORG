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

if (!isset($input['table_number'])) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'Номер столика обязателен'));
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
    // Получаем информацию о тарифе ресторана
    $stmt = $db->prepare("SELECT plan FROM restaurants WHERE id = ?");
    $stmt->execute(array($restaurantId));
    $restaurant = $stmt->fetch();
    
    if (!$restaurant) {
        http_response_code(404);
        echo json_encode(array('success' => false, 'message' => 'Ресторан не найден'));
        exit();
    }
    
    $plan = $restaurant['plan'];
    
    // Проверяем количество существующих столиков
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM tables WHERE restaurant_id = ?");
    $stmt->execute(array($restaurantId));
    $result = $stmt->fetch();
    $currentTables = $result['count'];
    
    // Проверяем лимиты по тарифу
    if ($plan === 'FREE' && $currentTables >= 5) {
        echo json_encode(array(
            'success' => false, 
            'message' => 'limit_reached',
            'limit_type' => 'tables',
            'current_count' => $currentTables,
            'limit' => 5,
            'plan' => 'FREE'
        ));
        exit();
    }
    
    if ($plan === 'PREMIUM' && $currentTables >= 50) {
        echo json_encode(array(
            'success' => false, 
            'message' => 'limit_reached',
            'limit_type' => 'tables',
            'current_count' => $currentTables,
            'limit' => 50,
            'plan' => 'PREMIUM'
        ));
        exit();
    }
    
    // Проверяем что номер столика уникален
    $stmt = $db->prepare("
        SELECT id FROM tables 
        WHERE restaurant_id = ? AND table_number = ? 
        LIMIT 1
    ");
    $stmt->execute(array($restaurantId, $input['table_number']));
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'message' => 'Столик с таким номером уже существует'));
        exit();
    }
    
    $stmt = $db->prepare("
        INSERT INTO tables (restaurant_id, table_number, is_active) 
        VALUES (?, ?, ?)
    ");
    $stmt->execute(array(
        $restaurantId,
        $input['table_number'],
        isset($input['is_active']) ? $input['is_active'] : true
    ));
    
    $tableId = $db->lastInsertId();
    
    echo json_encode(array(
        'success' => true,
        'message' => 'Столик успешно создан',
        'table_id' => $tableId,
        'limits' => array(
            'current_tables' => $currentTables + 1,
            'max_tables' => $plan === 'FREE' ? 5 : 50,
            'plan' => $plan
        )
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Create Table Error: " . $e->getMessage());
}

