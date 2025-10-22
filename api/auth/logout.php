<?php
header('Content-Type: application/json');
require_once '../../config/session.php';

destroySession();

echo json_encode(array(
    'success' => true,
    'message' => 'Выход выполнен успешно'
));

