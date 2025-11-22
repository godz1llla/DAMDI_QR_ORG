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
    $stmt = $db->query("SELECT COUNT(*) as count FROM restaurants");
    $totalRestaurants = $stmt->fetch()['count'];
    
    $stmt = $db->query("SELECT COUNT(*) as count FROM restaurants WHERE is_active = TRUE");
    $activeRestaurants = $stmt->fetch()['count'];
    
    $stmt = $db->query("SELECT COUNT(*) as count FROM restaurants WHERE plan = 'PREMIUM'");
    $premiumRestaurants = $stmt->fetch()['count'];
    
    $stmt = $db->query("SELECT COUNT(*) as count FROM orders");
    $totalOrders = $stmt->fetch()['count'];
    
    $stmt = $db->query("SELECT SUM(total_amount) as sum FROM orders");
    $totalRevenue = $stmt->fetch()['sum'] ?? 0;
    
    $stmt = $db->query("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'");
    $totalAdmins = $stmt->fetch()['count'];
    
    $stmt = $db->query("SELECT COUNT(*) as count FROM users WHERE role = 'STAFF'");
    $totalStaff = $stmt->fetch()['count'];
    
    echo json_encode(array(
        'success' => true,
        'stats' => array(
            'total_restaurants' => $totalRestaurants,
            'active_restaurants' => $activeRestaurants,
            'premium_restaurants' => $premiumRestaurants,
            'total_orders' => $totalOrders,
            'total_revenue' => $totalRevenue,
            'total_admins' => $totalAdmins,
            'total_staff' => $totalStaff
        )
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Get Stats Error: " . $e->getMessage());
}

