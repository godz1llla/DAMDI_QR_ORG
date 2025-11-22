<?php
header('Content-Type: application/json');
require_once '../../config/session.php';
require_once '../../utils/image-processor.php';

requireRole(array('ADMIN', 'SUPER_ADMIN'));

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('success' => false, 'message' => 'Метод не разрешён'));
    exit();
}

if (!isset($_FILES['image'])) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'Файл не загружен'));
    exit();
}

$processor = new ImageProcessor();
$result = $processor->processUpload($_FILES['image']);

if (!$result['success']) {
    http_response_code(400);
    echo json_encode($result);
    exit();
}

echo json_encode($result);

