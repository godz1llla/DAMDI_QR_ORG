<?php
header('Content-Type: application/json');
require_once '../../config/database.php';
require_once '../../config/session.php';

requireRole(array('ADMIN', 'SUPER_ADMIN'));

$user = getUser();
$restaurantId = $user['restaurant_id'];

if (!$restaurantId && $user['role'] !== 'SUPER_ADMIN') {
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
    $period = isset($_GET['period']) ? $_GET['period'] : 'today';
    
    $dateCondition = '';
    switch ($period) {
        case 'today':
            $dateCondition = "DATE(o.created_at) = CURDATE()";
            break;
        case 'week':
            $dateCondition = "o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            break;
        case 'month':
            $dateCondition = "o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            break;
        default:
            $dateCondition = "1=1";
    }
    
    $restaurantCondition = $restaurantId ? "o.restaurant_id = $restaurantId AND" : "";
    
    // Общая статистика
    $stmt = $db->query("
        SELECT 
            COUNT(*) as total_orders,
            SUM(o.total_amount) as total_revenue,
            AVG(o.total_amount) as avg_check
        FROM orders o
        WHERE $restaurantCondition $dateCondition
    ");
    $stats = $stmt->fetch();
    
    // Статистика по статусам
    $stmt = $db->query("
        SELECT 
            o.status,
            COUNT(*) as count
        FROM orders o
        WHERE $restaurantCondition $dateCondition
        GROUP BY o.status
    ");
    $statusStats = $stmt->fetchAll();
    
    // Топ блюд
    $stmt = $db->query("
        SELECT 
            mi.name,
            SUM(oi.quantity) as total_quantity,
            SUM(oi.quantity * oi.price) as total_revenue
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        JOIN orders o ON oi.order_id = o.id
        WHERE $restaurantCondition $dateCondition
        GROUP BY mi.id, mi.name
        ORDER BY total_quantity DESC
        LIMIT 10
    ");
    $topDishes = $stmt->fetchAll();
    
    // Заказы по часам (сегодня)
    if ($period === 'today') {
        $stmt = $db->query("
            SELECT 
                HOUR(o.created_at) as hour,
                COUNT(*) as count
            FROM orders o
            WHERE $restaurantCondition DATE(o.created_at) = CURDATE()
            GROUP BY HOUR(o.created_at)
            ORDER BY hour
        ");
        $hourlyOrders = $stmt->fetchAll();
    } else {
        $hourlyOrders = [];
    }
    
    echo json_encode(array(
        'success' => true,
        'period' => $period,
        'stats' => array(
            'total_orders' => $stats['total_orders'] ?? 0,
            'total_revenue' => $stats['total_revenue'] ?? 0,
            'avg_check' => $stats['avg_check'] ?? 0
        ),
        'status_breakdown' => $statusStats,
        'top_dishes' => $topDishes,
        'hourly_orders' => $hourlyOrders
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Get Order Stats Error: " . $e->getMessage());
}

