<?php
header('Content-Type: application/json');
require_once '../../config/session.php';

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(array('success' => false, 'message' => 'Не авторизован'));
    exit();
}

echo json_encode(array(
    'success' => true,
    'user' => getUser()
));

