<?php
header('Content-Type: application/json');
require_once '../../config/database.php';
require_once '../../config/session.php';
require_once '../../utils/qr-generator.php';

requireRole('ADMIN');

if (!isset($_GET['table_id'])) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'Table ID required'));
    exit();
}

$user = getUser();
$restaurantId = $user['restaurant_id'];
$tableId = intval($_GET['table_id']);

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Database connection error'));
    exit();
}

try {
    $stmt = $db->prepare("
        SELECT t.*, r.name as restaurant_name
        FROM tables t
        JOIN restaurants r ON t.restaurant_id = r.id
        WHERE t.id = ? AND t.restaurant_id = ?
        LIMIT 1
    ");
    $stmt->execute(array($tableId, $restaurantId));
    $table = $stmt->fetch();
    
    if (!$table) {
        http_response_code(404);
        echo json_encode(array('success' => false, 'message' => 'Table not found'));
        exit();
    }
    
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $menuUrl = "{$protocol}://{$host}/menu/client.html?restaurant_id={$restaurantId}&table_id={$tableId}";
    
    $qrDataUri = QRGenerator::generateDataUri($menuUrl, 300);
    
    echo json_encode(array(
        'success' => true,
        'qr_code' => $qrDataUri,
        'menu_url' => $menuUrl,
        'table_number' => $table['table_number'],
        'restaurant_name' => $table['restaurant_name']
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Server error'));
    error_log("QR Preview Error: " . $e->getMessage());
}