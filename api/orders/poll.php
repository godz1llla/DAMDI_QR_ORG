<?php
header('Content-Type: application/json');
require_once '../../config/database.php';
require_once '../../config/session.php';

requireRole(array('ADMIN', 'STAFF'));

$user = getUser();
$restaurantId = $user['restaurant_id'];

if (!$restaurantId) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'Ресторан не найден'));
    exit();
}

$lastCheck = isset($_GET['last_check']) ? $_GET['last_check'] : null;

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка подключения к базе данных'));
    exit();
}

try {
    if ($lastCheck) {
        $stmt = $db->prepare("
            SELECT 
                o.*,
                t.table_number,
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', oi.id,
                        'menu_item_id', oi.menu_item_id,
                        'quantity', oi.quantity,
                        'price', oi.price,
                        'notes', oi.notes,
                        'name', mi.name
                    )
                ) FROM order_items oi
                LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
                WHERE oi.order_id = o.id) as items
            FROM orders o
            LEFT JOIN tables t ON o.table_id = t.id
            WHERE o.restaurant_id = ? AND o.updated_at > ?
            ORDER BY o.created_at DESC
        ");
        $stmt->execute(array($restaurantId, $lastCheck));
    } else {
        $stmt = $db->prepare("
            SELECT 
                o.*,
                t.table_number,
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', oi.id,
                        'menu_item_id', oi.menu_item_id,
                        'quantity', oi.quantity,
                        'price', oi.price,
                        'notes', oi.notes,
                        'name', mi.name
                    )
                ) FROM order_items oi
                LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
                WHERE oi.order_id = o.id) as items
            FROM orders o
            LEFT JOIN tables t ON o.table_id = t.id
            WHERE o.restaurant_id = ? AND o.status IN ('NEW', 'PREPARING', 'SERVED')
            ORDER BY o.created_at DESC
        ");
        $stmt->execute(array($restaurantId));
    }
    
    $orders = $stmt->fetchAll();
    
    foreach ($orders as &$order) {
        if ($order['items']) {
            $order['items'] = json_decode($order['items'], true);
        } else {
            $order['items'] = array();
        }
    }
    
    echo json_encode(array(
        'success' => true,
        'orders' => $orders,
        'timestamp' => date('Y-m-d H:i:s')
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Poll Orders Error: " . $e->getMessage());
}

