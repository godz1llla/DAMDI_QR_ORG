<?php
header('Content-Type: application/json');
require_once '../../config/database.php';
require_once '../../config/session.php';

requireRole('ADMIN');

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
    $stmt = $db->prepare("
        SELECT * FROM tables 
        WHERE restaurant_id = ?
        ORDER BY table_number ASC
    ");
    $stmt->execute(array($restaurantId));
    $tables = $stmt->fetchAll();
    
    // Получаем информацию о тарифе для лимитов
    $stmt = $db->prepare("SELECT plan FROM restaurants WHERE id = ?");
    $stmt->execute(array($restaurantId));
    $restaurant = $stmt->fetch();
    $plan = $restaurant['plan'];
    
    $tablesLimit = $plan === 'FREE' ? 5 : 50;
    
    echo json_encode(array(
        'success' => true,
        'tables' => $tables,
        'limits' => array(
            'current_tables' => count($tables),
            'max_tables' => $tablesLimit,
            'plan' => $plan
        )
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Get Tables Error: " . $e->getMessage());
}

