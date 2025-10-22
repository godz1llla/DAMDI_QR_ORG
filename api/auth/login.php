<?php
header('Content-Type: application/json');
require_once '../../config/database.php';
require_once '../../config/session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('success' => false, 'message' => 'Метод не разрешён'));
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'Email и пароль обязательны'));
    exit();
}

$email = trim($input['email']);
$password = $input['password'];

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка подключения к базе данных'));
    exit();
}

try {
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND is_blocked = FALSE LIMIT 1");
    $stmt->execute(array($email));
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(array('success' => false, 'message' => 'Неверный email или пароль'));
        exit();
    }
    
    if ($user['role'] === 'ADMIN' || $user['role'] === 'STAFF') {
        $stmt = $db->prepare("SELECT is_active FROM restaurants WHERE id = ? LIMIT 1");
        $stmt->execute(array($user['restaurant_id']));
        $restaurant = $stmt->fetch();
        
        if (!$restaurant || !$restaurant['is_active']) {
            http_response_code(403);
            echo json_encode(array('success' => false, 'message' => 'Ресторан заблокирован'));
            exit();
        }
    }
    
    setUserSession($user);
    
    $redirectUrl = '/index.html';
    switch($user['role']) {
        case 'SUPER_ADMIN':
            $redirectUrl = '/dashboard/super-admin.html';
            break;
        case 'ADMIN':
            $redirectUrl = '/dashboard/admin.html';
            break;
        case 'STAFF':
            $redirectUrl = '/dashboard/staff.html';
            break;
    }
    
    echo json_encode(array(
        'success' => true,
        'message' => 'Вход выполнен успешно',
        'redirect' => $redirectUrl,
        'user' => array(
            'role' => $user['role'],
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name']
        )
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Ошибка сервера'));
    error_log("Login Error: " . $e->getMessage());
}

