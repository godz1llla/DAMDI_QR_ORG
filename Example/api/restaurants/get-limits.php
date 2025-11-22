<?php
header('Content-Type: application/json');
require_once '../../config/database.php';
require_once '../../config/session.php';

requireRole('ADMIN');

$user = getUser();
$restaurantId = $user['restaurant_id'];

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Database connection error'));
    exit();
}

try {
    // Получаем информацию о тарифе ресторана
    $stmt = $db->prepare("SELECT plan FROM restaurants WHERE id = ?");
    $stmt->execute(array($restaurantId));
    $restaurant = $stmt->fetch();
    
    if (!$restaurant) {
        http_response_code(404);
        echo json_encode(array('success' => false, 'message' => 'Restaurant not found'));
        exit();
    }
    
    $plan = $restaurant['plan'];
    
    // Подсчитываем текущие ресурсы
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM tables WHERE restaurant_id = ?");
    $stmt->execute(array($restaurantId));
    $tablesCount = $stmt->fetch()['count'];
    
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM menu_categories WHERE restaurant_id = ?");
    $stmt->execute(array($restaurantId));
    $categoriesCount = $stmt->fetch()['count'];
    
    // Определяем лимиты по тарифу
    $tablesLimit = $plan === 'FREE' ? 5 : 50;
    $categoriesLimit = $plan === 'FREE' ? 5 : 999;
    
    echo json_encode(array(
        'success' => true,
        'limits' => array(
            'plan' => $plan,
            'tables' => array(
                'current' => $tablesCount,
                'max' => $tablesLimit,
                'remaining' => max(0, $tablesLimit - $tablesCount)
            ),
            'categories' => array(
                'current' => $categoriesCount,
                'max' => $categoriesLimit,
                'remaining' => max(0, $categoriesLimit - $categoriesCount)
            )
        )
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Server error'));
    error_log("Get Limits Error: " . $e->getMessage());
}
