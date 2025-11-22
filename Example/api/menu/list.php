<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

$restaurantId = isset($_GET['restaurant_id']) ? intval($_GET['restaurant_id']) : null;

if (!$restaurantId) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'ID ресторана обязателен'));
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
        SELECT * FROM menu_categories 
        WHERE restaurant_id = ? AND is_active = TRUE 
        ORDER BY sort_order ASC, name ASC
    ");
    $stmt->execute(array($restaurantId));
    $categories = $stmt->fetchAll();
    
    $stmt = $db->prepare("
        SELECT * FROM menu_items 
        WHERE restaurant_id = ? AND is_available = TRUE 
        ORDER BY category_id ASC, sort_order ASC, name ASC
    ");
    $stmt->execute(array($restaurantId));
    $items = $stmt->fetchAll();
    
    $menu = array();
    foreach ($categories as $category) {
        $categoryItems = array_filter($items, function($item) use ($category) {
            return $item['category_id'] == $category['id'];
        });
        
        $menu[] = array(
            'category' => $category,
            'items' => array_values($categoryItems)
        );
    }
    
    // Получаем информацию о тарифе для лимитов
    $stmt = $db->prepare("SELECT plan FROM restaurants WHERE id = ?");
    $stmt->execute(array($restaurantId));
    $restaurant = $stmt->fetch();
    $plan = $restaurant['plan'];
    
    $categoriesLimit = $plan === 'FREE' ? 5 : 999;
    
    echo json_encode(array(
        'success' => true,
        'menu' => $menu,
        'limits' => array(
            'current_categories' => count($menu['categories']),
            'max_categories' => $categoriesLimit,
            'plan' => $plan
        )
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Get Menu Error: " . $e->getMessage());
}

