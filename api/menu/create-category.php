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

if (!isset($input['name'])) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'Название категории обязательно'));
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
    
    // Проверяем количество существующих категорий
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM menu_categories WHERE restaurant_id = ?");
    $stmt->execute(array($restaurantId));
    $result = $stmt->fetch();
    $currentCategories = $result['count'];
    
    // Проверяем лимиты по тарифу (только для FREE)
    if ($plan === 'FREE' && $currentCategories >= 5) {
        echo json_encode(array(
            'success' => false, 
            'message' => 'limit_reached',
            'limit_type' => 'categories',
            'current_count' => $currentCategories,
            'limit' => 5,
            'plan' => 'FREE'
        ));
        exit();
    }
    
    // Проверяем что название категории уникально
    $stmt = $db->prepare("SELECT id FROM menu_categories WHERE restaurant_id = ? AND name = ?");
    $stmt->execute(array($restaurantId, $input['name']));
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'message' => 'Категория с таким названием уже существует'));
        exit();
    }
    
    $stmt = $db->prepare("
        INSERT INTO menu_categories 
        (restaurant_id, name, sort_order, is_active) 
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute(array(
        $restaurantId,
        $input['name'],
        $input['sort_order'] ?? 0,
        isset($input['is_active']) ? $input['is_active'] : true
    ));
    
    $categoryId = $db->lastInsertId();
    
    echo json_encode(array(
        'success' => true,
        'message' => 'Категория успешно создана',
        'category_id' => $categoryId,
        'limits' => array(
            'current_categories' => $currentCategories + 1,
            'max_categories' => $plan === 'FREE' ? 5 : 999,
            'plan' => $plan
        )
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Create Category Error: " . $e->getMessage());
}

