<?php
header('Content-Type: application/json');
require_once '../../config/database.php';
require_once '../../config/session.php';

requireRole('SUPER_ADMIN');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка подключения к базе данных'));
    exit();
}

try {
    $stmt = $db->prepare("
        SELECT 
            r.*,
            u.email as owner_email,
            u.first_name as owner_first_name,
            u.last_name as owner_last_name,
            (SELECT COUNT(*) FROM orders WHERE restaurant_id = r.id) as total_orders,
            (SELECT COUNT(*) FROM users WHERE restaurant_id = r.id AND role = 'STAFF') as staff_count
        FROM restaurants r
        LEFT JOIN users u ON r.owner_id = u.id
        ORDER BY r.created_at DESC
    ");
    $stmt->execute();
    $restaurants = $stmt->fetchAll();
    
    echo json_encode(array(
        'success' => true,
        'restaurants' => $restaurants
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Get Restaurants Error: " . $e->getMessage());
}

