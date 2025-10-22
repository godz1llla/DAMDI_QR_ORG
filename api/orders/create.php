<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('success' => false, 'message' => 'Метод не разрешён'));
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['restaurant_id']) || !isset($input['table_id']) || !isset($input['items']) || empty($input['items'])) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'Обязательные поля: restaurant_id, table_id, items'));
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
    $db->beginTransaction();
    
    $totalAmount = 0;
    foreach ($input['items'] as $item) {
        $stmt = $db->prepare("SELECT price FROM menu_items WHERE id = ? AND restaurant_id = ? AND is_available = TRUE LIMIT 1");
        $stmt->execute(array($item['menu_item_id'], $input['restaurant_id']));
        $menuItem = $stmt->fetch();
        
        if (!$menuItem) {
            $db->rollBack();
            http_response_code(400);
            echo json_encode(array('success' => false, 'message' => 'Некорректный элемент меню'));
            exit();
        }
        
        $totalAmount += $menuItem['price'] * $item['quantity'];
    }
    
    $stmt = $db->prepare("
        INSERT INTO orders (restaurant_id, table_id, status, total_amount) 
        VALUES (?, ?, 'NEW', ?)
    ");
    $stmt->execute(array(
        $input['restaurant_id'],
        $input['table_id'],
        $totalAmount
    ));
    $orderId = $db->lastInsertId();
    
    foreach ($input['items'] as $item) {
        $stmt = $db->prepare("SELECT price FROM menu_items WHERE id = ? LIMIT 1");
        $stmt->execute(array($item['menu_item_id']));
        $menuItem = $stmt->fetch();
        
        $stmt = $db->prepare("
            INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute(array(
            $orderId,
            $item['menu_item_id'],
            $item['quantity'],
            $menuItem['price'],
            $item['notes'] ?? null
        ));
    }
    
    $db->commit();
    
    echo json_encode(array(
        'success' => true,
        'message' => 'Заказ успешно создан',
        'order_id' => $orderId,
        'total_amount' => $totalAmount
    ));
    
} catch(PDOException $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Create Order Error: " . $e->getMessage());
}

